#!/usr/bin/env python3
"""Import parsed Home Depot email receipts into LeadFlow.

The parser output and extracted PDFs are the source. Exact, unique job matches
become material expenses automatically; ambiguous receipts stay in the private
receipt_imports review queue. Re-running the same batch is safe.

Examples:
  python scripts/home_depot_receipt_importer.py \
    /path/to/parsed_and_matched.json --dry-run

  python scripts/home_depot_receipt_importer.py \
    /path/to/parsed_and_matched.json --apply \
    --overrides /path/to/approved_receipt_job_overrides.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extensions import connection as PgConnection

SOURCE = "home_depot_gmail"
MIME_TYPE = "application/pdf"


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        if "=" not in line or line.lstrip().startswith("#"):
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def decimal_value(value: Any) -> Decimal | None:
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def purchase_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def load_overrides(path: Path | None) -> dict[str, Any]:
    if not path:
        return {"orders": {}, "hashes": {}, "files": {}}
    raw = json.loads(path.read_text())
    if any(key in raw for key in ("orders", "hashes", "files")):
        return {
            "orders": raw.get("orders", {}),
            "hashes": raw.get("hashes", {}),
            "files": raw.get("files", {}),
        }
    # A simple {"ORDER-NUMBER": 123} file is also accepted.
    return {"orders": raw, "hashes": {}, "files": {}}


def override_job_id(
    receipt: dict[str, Any], receipt_hash: str, overrides: dict[str, Any]
) -> int | None:
    for bucket, key in (
        ("orders", receipt.get("order")),
        ("hashes", receipt_hash),
        ("files", receipt.get("file")),
    ):
        if key and str(key) in overrides.get(bucket, {}):
            value = overrides[bucket][str(key)]
            if isinstance(value, dict):
                value = value.get("job_id")
            try:
                return int(value)
            except (TypeError, ValueError):
                raise ValueError(f"Invalid approved job override for {key!r}")
    return None


def automatic_job_id(receipt: dict[str, Any]) -> int | None:
    match = receipt.get("match") or {}
    if match.get("status") != "matched":
        return None
    exact_ids = {
        int(candidate["job_id"])
        for candidate in match.get("candidates", [])
        if candidate.get("exact") and candidate.get("job_id")
    }
    # Automation is intentionally conservative: multiple exact jobs require an
    # explicit order/hash override even when one candidate ranks first.
    if len(exact_ids) == 1:
        return next(iter(exact_ids))
    return None


def item_summary(items: list[Any]) -> str:
    clean = [" ".join(str(item).split()) for item in items if str(item).strip()]
    if not clean:
        return "No item description extracted"
    shown = clean[:8]
    summary = "; ".join(shown)
    if len(clean) > len(shown):
        summary += f"; plus {len(clean) - len(shown)} additional line item(s)"
    return summary


def expense_notes(receipt: dict[str, Any], receipt_hash: str) -> str:
    pieces = ["Automatically imported from a Home Depot Gmail receipt."]
    if receipt.get("order"):
        pieces.append(f"Order: {receipt['order']}.")
    if receipt.get("po_job_name"):
        pieces.append(f"PO/job label: {receipt['po_job_name']}.")
    if receipt.get("store"):
        pieces.append(f"Store: {receipt['store']}.")
    pieces.append(f"Items: {item_summary(receipt.get('items') or [])}.")
    if receipt.get("message_id"):
        pieces.append(f"Gmail Message-ID: {receipt['message_id']}.")
    pieces.append(f"Receipt SHA-256: {receipt_hash}.")
    return " ".join(pieces)


def verify_schema(conn: PgConnection) -> None:
    with conn.cursor() as cur:
        cur.execute("select to_regclass('public.receipt_imports')")
        if not cur.fetchone()[0]:
            raise RuntimeError(
                "receipt_imports table is missing; run scripts/receipt-import-schema.sql first"
            )


def get_job(cur: Any, org_id: int, job_id: int) -> dict[str, Any] | None:
    cur.execute(
        """
        select j.id, j.status, j.customer_name, j.customer_address,
               coalesce(p.address, j.customer_address, l.address) as receipt_address
          from jobs j
          left join leads l on l.id=j.lead_id and l.org_id=j.org_id
          left join properties p on p.id=j.property_id and p.org_id=j.org_id
         where j.org_id=%s and j.id=%s
        """,
        (org_id, job_id),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "status": row[1],
        "customer_name": row[2],
        "customer_address": row[3],
        "receipt_address": row[4],
    }


def existing_import(cur: Any, org_id: int, receipt_hash: str) -> dict[str, Any] | None:
    cur.execute(
        """
        select id,status,expense_id,job_id
          from receipt_imports
         where org_id=%s and receipt_sha256=%s
         limit 1
        """,
        (org_id, receipt_hash),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "status": row[1], "expense_id": row[2], "job_id": row[3]}


def existing_expense(
    cur: Any, org_id: int, job_id: int, receipt: dict[str, Any]
) -> int | None:
    file_name = str(receipt.get("file") or "")
    order_number = str(receipt.get("order") or "")
    if order_number:
        cur.execute(
            """
            select id,amount::text
              from expenses
             where org_id=%s and job_id=%s
               and (receipt_file_name=%s or notes ilike %s)
             order by id
            """,
            (org_id, job_id, file_name, f"%{order_number}%"),
        )
    else:
        cur.execute(
            """
            select id,amount::text
              from expenses
             where org_id=%s and job_id=%s and receipt_file_name=%s
             order by id
            """,
            (org_id, job_id, file_name),
        )
    rows = cur.fetchall()
    if len(rows) > 1:
        raise RuntimeError(f"Multiple existing expenses match {file_name}")
    if not rows:
        return None
    expected = decimal_value(receipt.get("total"))
    actual = decimal_value(rows[0][1])
    if expected != actual:
        raise RuntimeError(
            f"Existing expense #{rows[0][0]} amount {actual} does not match receipt {expected}"
        )
    return int(rows[0][0])


def upsert_review_row(
    cur: Any,
    *,
    org_id: int,
    receipt: dict[str, Any],
    receipt_hash: str,
    file_data: bytes,
    status: str,
    reason: str,
    job_id: int | None = None,
    expense_id: int | None = None,
) -> int:
    cur.execute(
        """
        insert into receipt_imports
          (org_id,expense_id,job_id,source,message_id,email_subject,order_number,
           receipt_sha256,file_name,mime_type,size_bytes,file_data,purchase_date,
           vendor,subtotal,tax,total,po_job_name,items_json,status,match_reason,
           created_at,updated_at)
        values
          (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now(),now())
        on conflict (org_id,receipt_sha256) do update set
          expense_id=coalesce(excluded.expense_id,receipt_imports.expense_id),
          job_id=coalesce(excluded.job_id,receipt_imports.job_id),
          message_id=excluded.message_id,
          email_subject=excluded.email_subject,
          order_number=excluded.order_number,
          file_name=excluded.file_name,
          mime_type=excluded.mime_type,
          size_bytes=excluded.size_bytes,
          file_data=excluded.file_data,
          purchase_date=excluded.purchase_date,
          vendor=excluded.vendor,
          subtotal=excluded.subtotal,
          tax=excluded.tax,
          total=excluded.total,
          po_job_name=excluded.po_job_name,
          items_json=excluded.items_json,
          status=excluded.status,
          match_reason=excluded.match_reason,
          updated_at=now()
        returning id
        """,
        (
            org_id,
            expense_id,
            job_id,
            SOURCE,
            receipt.get("message_id"),
            receipt.get("subject"),
            receipt.get("order"),
            receipt_hash,
            str(receipt.get("file") or "receipt.pdf")[:255],
            MIME_TYPE,
            len(file_data),
            psycopg2.Binary(file_data),
            purchase_datetime(receipt.get("purchase_at")),
            "Home Depot",
            decimal_value(receipt.get("subtotal")),
            decimal_value(receipt.get("tax")),
            decimal_value(receipt.get("total")),
            str(receipt.get("po_job_name") or "")[:240] or None,
            json.dumps(receipt.get("items") or [], ensure_ascii=False),
            status,
            reason,
        ),
    )
    return int(cur.fetchone()[0])


def import_receipt(
    conn: PgConnection,
    *,
    org_id: int,
    entered_by_id: int,
    receipt: dict[str, Any],
    file_data: bytes,
    receipt_hash: str,
    job_id: int,
    approved_override: bool,
) -> tuple[str, int]:
    total = decimal_value(receipt.get("total"))
    purchased_at = purchase_datetime(receipt.get("purchase_at"))
    if total is None or total <= 0:
        raise RuntimeError("Receipt has no positive total")
    if purchased_at is None:
        raise RuntimeError("Receipt has no valid purchase date")

    with conn:
        with conn.cursor() as cur:
            job = get_job(cur, org_id, job_id)
            if not job:
                raise RuntimeError(f"Approved job #{job_id} does not exist in organization {org_id}")

            prior = existing_import(cur, org_id, receipt_hash)
            if prior and prior["status"] == "imported" and prior["expense_id"]:
                return "duplicate", int(prior["expense_id"])

            expense_id = existing_expense(cur, org_id, job_id, receipt)
            action = "adopted_existing" if expense_id else "imported"
            if not expense_id:
                cur.execute(
                    """
                    insert into expenses
                      (org_id,job_id,category,vendor,amount,purchase_date,paid_by,notes,
                       receipt_url,receipt_file_name,receipt_mime_type,receipt_size_bytes,
                       receipt_address,entered_by_id,created_at,updated_at)
                    values
                      (%s,%s,'materials_purchase','Home Depot',%s,%s,null,%s,null,%s,%s,%s,%s,%s,now(),now())
                    returning id
                    """,
                    (
                        org_id,
                        job_id,
                        total,
                        purchased_at,
                        expense_notes(receipt, receipt_hash),
                        str(receipt.get("file") or "receipt.pdf")[:255],
                        MIME_TYPE,
                        len(file_data),
                        job.get("receipt_address"),
                        entered_by_id,
                    ),
                )
                expense_id = int(cur.fetchone()[0])

            reason = (
                f"Explicit approved override to Job #{job_id}"
                if approved_override
                else f"Unique exact parser match to Job #{job_id}"
            )
            upsert_review_row(
                cur,
                org_id=org_id,
                receipt=receipt,
                receipt_hash=receipt_hash,
                file_data=file_data,
                status="imported",
                reason=reason,
                job_id=job_id,
                expense_id=expense_id,
            )
            cur.execute(
                """
                update expenses
                   set receipt_url=%s,
                       receipt_file_name=%s,
                       receipt_mime_type=%s,
                       receipt_size_bytes=%s,
                       receipt_address=coalesce(receipt_address,%s),
                       updated_at=now()
                 where id=%s and org_id=%s
                """,
                (
                    f"/api/expense-receipts/{expense_id}",
                    str(receipt.get("file") or "receipt.pdf")[:255],
                    MIME_TYPE,
                    len(file_data),
                    job.get("receipt_address"),
                    expense_id,
                    org_id,
                ),
            )
            return action, expense_id


def queue_review(
    conn: PgConnection,
    *,
    org_id: int,
    receipt: dict[str, Any],
    file_data: bytes,
    receipt_hash: str,
    reason: str,
) -> tuple[str, int | None]:
    with conn:
        with conn.cursor() as cur:
            prior = existing_import(cur, org_id, receipt_hash)
            if prior and prior["status"] == "imported" and prior["expense_id"]:
                return "duplicate", int(prior["expense_id"])
            upsert_review_row(
                cur,
                org_id=org_id,
                receipt=receipt,
                receipt_hash=receipt_hash,
                file_data=file_data,
                status="review",
                reason=reason,
            )
            return "review", None


def process(args: argparse.Namespace) -> dict[str, Any]:
    payload = json.loads(args.parsed_json.read_text())
    receipts = payload.get("receipts") or []
    attachments = args.attachments or args.parsed_json.parent / "attachments"
    overrides = load_overrides(args.overrides)

    load_env(args.env)
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")

    conn = psycopg2.connect(database_url)
    results: list[dict[str, Any]] = []
    try:
        verify_schema(conn)
        conn.commit()
        for receipt in receipts:
            file_path = attachments / str(receipt.get("file") or "")
            record = {
                "file": receipt.get("file"),
                "order": receipt.get("order"),
                "po_job_name": receipt.get("po_job_name"),
                "total": receipt.get("total"),
            }
            try:
                file_data = file_path.read_bytes()
                if not file_data.startswith(b"%PDF"):
                    raise RuntimeError("Extracted attachment is not a PDF")
                receipt_hash = hashlib.sha256(file_data).hexdigest()
                approved_job_id = override_job_id(receipt, receipt_hash, overrides)
                job_id = approved_job_id or automatic_job_id(receipt)
                approved_override = approved_job_id is not None

                if job_id:
                    intended = "approved override" if approved_override else "unique exact match"
                    if args.dry_run:
                        record.update(action="would_import", job_id=job_id, reason=intended)
                    else:
                        action, expense_id = import_receipt(
                            conn,
                            org_id=args.org_id,
                            entered_by_id=args.entered_by_id,
                            receipt=receipt,
                            file_data=file_data,
                            receipt_hash=receipt_hash,
                            job_id=job_id,
                            approved_override=approved_override,
                        )
                        record.update(action=action, job_id=job_id, expense_id=expense_id, reason=intended)
                else:
                    match = receipt.get("match") or {}
                    exact_job_ids = {
                        candidate.get("job_id")
                        for candidate in match.get("candidates", [])
                        if candidate.get("exact") and candidate.get("job_id")
                    }
                    if len(exact_job_ids) > 1:
                        reason = "Multiple exact production jobs; explicit approval required"
                    else:
                        reason = match.get("reason") or "No safe production-job match"
                    if args.dry_run:
                        record.update(action="would_review", job_id=None, reason=reason)
                    else:
                        action, expense_id = queue_review(
                            conn,
                            org_id=args.org_id,
                            receipt=receipt,
                            file_data=file_data,
                            receipt_hash=receipt_hash,
                            reason=reason,
                        )
                        record.update(action=action, job_id=None, expense_id=expense_id, reason=reason)
            except Exception as exc:
                conn.rollback()
                record.update(action="error", error=str(exc))
                if args.stop_on_error:
                    raise
            results.append(record)
    finally:
        conn.close()

    counts: dict[str, int] = {}
    for row in results:
        counts[row["action"]] = counts.get(row["action"], 0) + 1
    return {
        "mode": "dry-run" if args.dry_run else "apply",
        "source": str(args.parsed_json),
        "receipt_count": len(receipts),
        "counts": counts,
        "results": results,
    }


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("parsed_json", type=Path)
    parser.add_argument("--attachments", type=Path)
    parser.add_argument("--overrides", type=Path)
    parser.add_argument("--env", type=Path, default=repo / ".env")
    parser.add_argument("--org-id", type=int, default=1)
    parser.add_argument("--entered-by-id", type=int, default=1)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--apply", action="store_true")
    parser.add_argument("--stop-on-error", action="store_true")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    result = process(args)
    output = json.dumps(result, indent=2, default=str)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(output + "\n")
    print(output)
    if result["counts"].get("error"):
        raise SystemExit(1)


if __name__ == "__main__":
    main()

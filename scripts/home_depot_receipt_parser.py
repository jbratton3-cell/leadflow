#!/usr/bin/env python3
"""Extract Home Depot PDF receipts from a Gmail MBOX, parse key fields, and
propose LeadFlow job matches without writing anything to the database.

Run with a Python environment containing pypdf, psycopg2-binary, and rapidfuzz:
  python home_depot_receipt_parser.py INPUT_MBOX OUTPUT_DIR
"""
from pathlib import Path
from email.header import decode_header, make_header
from datetime import datetime
from decimal import Decimal
import mailbox, json, re, os, sys
from pypdf import PdfReader
from rapidfuzz.fuzz import ratio, token_set_ratio
import psycopg2

REPO = Path(__file__).resolve().parents[1]
INPUT = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/user/uploads/Home Depot Test 10.txt")
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "/home/user/receipts_test_20261005")
ATTACH = OUT / "attachments"
TEXT = OUT / "text"
ATTACH.mkdir(parents=True, exist_ok=True)
TEXT.mkdir(parents=True, exist_ok=True)


def decode(value):
    return str(make_header(decode_header(value or "")))


def money(pattern, text):
    m = re.search(pattern, text, re.I | re.M)
    return str(Decimal(m.group(1).replace(",", "")).quantize(Decimal("0.01"))) if m else None


def normalize(value):
    value = (value or "").lower().replace("&", " and ")
    value = re.sub(r"\b(street|st\.?|road|rd\.?|drive|dr\.?|avenue|ave\.?|court|ct\.?|lane|ln\.?)\b", " ", value)
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def street_number(value):
    m = re.match(r"\s*(\d+[a-z]?)\b", normalize(value))
    return m.group(1) if m else None


def parse_date(text):
    patterns = [
        (r"(\d{1,2}/\d{1,2}/\d{4}),\s*(\d{1,2}:\d{2}\s*[AP]M)", "%m/%d/%Y %I:%M %p"),
        (r"(\d{1,2}/\d{1,2}/\d{2})\s+(\d{1,2}:\d{2}\s*[AP]M)", "%m/%d/%y %I:%M %p"),
    ]
    for pattern, fmt in patterns:
        m = re.search(pattern, text, re.I)
        if m:
            try:
                return datetime.strptime(f"{m.group(1)} {m.group(2)}", fmt)
            except ValueError:
                pass
    return None


def extract_online_items(text):
    start = text.find("# Item Description")
    end = text.find("Pro Xtra", start)
    if start < 0 or end < 0:
        return []
    section = text[start:end]
    blocks = re.split(r"(?m)(?=^\d{2}\s)", section)
    items = []
    for block in blocks:
        if not re.match(r"^\d{2}\s", block):
            continue
        clean = re.sub(r"^\d{2}\s+", "", block).strip()
        # Pricing/model columns begin at N/A or a long numeric SKU. Keep the descriptive prefix.
        clean = re.split(r"\s+N/A\s+|\s+\d{6,}\s+\$", clean, maxsplit=1)[0]
        clean = re.sub(r"\s+", " ", clean).strip()
        clean = re.sub(r"\s+SPECIAL BUY.*$", "", clean, flags=re.I)
        if clean:
            items.append(clean)
    return items


def extract_store_items(text):
    items = []
    for line in text.splitlines():
        m = re.match(r"\s*\d{9,}\s+(.+?)\s+[-]?\d+\.\d{2}\s*$", line)
        if m:
            desc = re.sub(r"\s+", " ", m.group(1)).strip(" -")
            if desc:
                items.append(desc)
    return items


def parse_receipt(path, email_meta):
    text = "\n".join((page.extract_text() or "") for page in PdfReader(str(path)).pages)
    (TEXT / f"{path.stem}.txt").write_text(text, errors="ignore")
    online = "Customer Receipt" in text and "PO / Job Name" in text
    date = parse_date(text)
    if online:
        order = (re.search(r"Order\s*#\s*([A-Z0-9-]+)", text, re.I) or [None, None])[1]
        po = None
        m = re.search(r"(?m)^\s*(.*?)PO\s*/\s*Job Name\s*$", text, re.I)
        if m:
            po = re.sub(r"\s+", " ", m.group(1)).strip() or None
        store = None
        sm = re.search(r"Store\s*#\s*(\d+)\s+Location\s+([^\n]+)", text, re.I)
        if sm:
            store = f"Store {sm.group(1)} — {sm.group(2).strip()}"
        items = extract_online_items(text)
        subtotal = money(r"^Subtotal\s*\$([0-9,]+\.\d{2})", text)
        tax = money(r"^Sales Tax\s*\$([0-9,]+\.\d{2})", text)
        total = money(r"^Order Total\s*\$([0-9,]+\.\d{2})", text)
        kind = "online"
    else:
        order = None
        po = None
        lines = [x.strip() for x in text.splitlines() if x.strip()]
        store = " · ".join(lines[:2]) if lines else None
        items = extract_store_items(text)
        subtotal = money(r"SUBTOTAL\s+\$?([0-9,]+\.\d{2})", text)
        tax = money(r"SALES TAX\s+\$?([0-9,]+\.\d{2})", text)
        total = money(r"\bTOTAL\s+\$\s*([0-9,]+\.\d{2})", text)
        kind = "in-store"
    return {
        "file": path.name,
        "message_number": email_meta["message_number"],
        "email_date": email_meta["email_date"],
        "subject": email_meta["subject"],
        "message_id": email_meta["message_id"],
        "type": kind,
        "purchase_at": date.isoformat(sep=" ") if date else None,
        "order": order,
        "po_job_name": po,
        "store": store,
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "items": items,
    }


def load_leadflow():
    env = REPO / ".env"
    for line in env.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("""
        select j.id,j.status,j.sale_id,j.lead_id,j.customer_name,j.customer_address,j.customer_city,
               j.start_date,j.completion_date,j.created_at,j.contract_amount,j.notes,
               l.first_name,l.last_name,l.company,l.address,l.city,l.notes,
               p.name,p.property_name,p.address,p.city,p.contact_name
        from jobs j
        left join leads l on l.id=j.lead_id and l.org_id=j.org_id
        left join properties p on p.id=j.property_id and p.org_id=j.org_id
        where j.org_id=1
    """)
    jobs = []
    for row in cur.fetchall():
        keys = ["id","status","sale_id","lead_id","customer_name","customer_address","customer_city",
                "start_date","completion_date","created_at","contract_amount","job_notes",
                "first_name","last_name","company","lead_address","lead_city","lead_notes",
                "location_name","property_name","property_address","property_city","site_contact"]
        jobs.append(dict(zip(keys,row)))
    cur.execute("select id,first_name,last_name,company,address,city,notes,stage from leads where org_id=1")
    leads = [dict(zip(["id","first_name","last_name","company","address","city","notes","stage"], row)) for row in cur.fetchall()]
    cur.close(); conn.close()
    return jobs, leads


def match_score(tag, fields):
    nt = normalize(tag)
    if not nt:
        return 0
    tag_num = street_number(tag)
    best = 0
    for field in fields:
        nf = normalize(field)
        if not nf:
            continue
        field_num = street_number(field)
        if tag_num and field_num and tag_num != field_num:
            continue
        if nt == nf:
            score = 100
        elif min(len(nt), len(nf)) >= 4 and (nt in nf or nf in nt):
            score = 96
        else:
            score = max(token_set_ratio(nt, nf), ratio(nt, nf))
        best = max(best, score)
    return best


def has_strict_match(tag, fields):
    nt = normalize(tag)
    if not nt:
        return False
    tag_num = street_number(tag)
    for field in fields:
        nf = normalize(field)
        if not nf or min(len(nt), len(nf)) < 4:
            continue
        field_num = street_number(field)
        if tag_num and field_num != tag_num:
            continue
        if nt == nf or nt in nf or nf in nt:
            return True
    return False


def propose_matches(receipt, jobs, leads):
    tag = receipt.get("po_job_name")
    if not tag:
        return {"status":"needs-review","reason":"No PO/job name printed on receipt","job_id":None,"lead_id":None,"candidates":[]}
    job_candidates=[]
    for job in jobs:
        fields=[job["customer_name"],job["customer_address"],job["customer_city"],job["first_name"],job["last_name"],job["company"],job["lead_address"],job["lead_notes"],job["location_name"],job["property_name"],job["property_address"],job["site_contact"]]
        score=match_score(tag,fields)
        exact=has_strict_match(tag,fields)
        if score>=72:
            current_bonus=8 if not (job.get("job_notes") or "").startswith("Imported from Housecall Pro") else 0
            active_bonus=5 if job.get("status") not in ("completed",) else 0
            value_bonus=2 if Decimal(job.get("contract_amount") or 0)>0 else 0
            job_candidates.append({"job_id":job["id"],"lead_id":job["lead_id"],"score":score,"exact":exact,"rank":score+current_bonus+active_bonus+value_bonus,"status":job["status"],"customer":job["company"] or " ".join(x for x in [job["first_name"],job["last_name"]] if x) or job["customer_name"],"address":job["property_address"] or job["customer_address"] or job["lead_address"],"notes":job["job_notes"]})
    job_candidates.sort(key=lambda x:(x["exact"],x["rank"],x["job_id"]),reverse=True)
    if job_candidates and job_candidates[0]["exact"]:
        top=job_candidates[0]
        # If exact candidates include legacy duplicates, choose the current LF job but expose all.
        return {"status":"matched","reason":"Exact job/address label match","job_id":top["job_id"],"lead_id":top["lead_id"],"candidates":job_candidates[:6]}
    lead_candidates=[]
    for lead in leads:
        fields=[lead["first_name"],lead["last_name"],lead["company"],lead["address"],lead["city"],lead["notes"]]
        score=match_score(tag,fields)
        exact=has_strict_match(tag,fields)
        if score>=78:
            lead_candidates.append({"lead_id":lead["id"],"score":score,"exact":exact,"customer":lead["company"] or " ".join(x for x in [lead["first_name"],lead["last_name"]] if x),"address":lead["address"],"stage":lead["stage"]})
    lead_candidates.sort(key=lambda x:(x["exact"],x["score"],x["lead_id"]),reverse=True)
    if lead_candidates and lead_candidates[0]["exact"]:
        return {"status":"lead-only","reason":"Customer/site label found, but no production job exists to receive the expense","job_id":None,"lead_id":lead_candidates[0]["lead_id"],"candidates":lead_candidates[:6]}
    if job_candidates:
        return {"status":"needs-review","reason":"Possible fuzzy job match","job_id":None,"lead_id":None,"candidates":job_candidates[:6]}
    return {"status":"unmatched","reason":"No exact customer, service address, or production job found in LeadFlow","job_id":None,"lead_id":None,"candidates":lead_candidates[:6]}


# Extract messages and attachments in deterministic date/subject order.
messages=[]
for n,msg in enumerate(mailbox.mbox(str(INPUT),create=False),1):
    messages.append((n,msg))
receipts=[]
for n,msg in messages:
    meta={"message_number":n,"email_date":msg.get("Date"),"subject":decode(msg.get("Subject")),"message_id":msg.get("Message-ID")}
    for part in msg.walk():
        filename=part.get_filename()
        if not filename and part.get_content_disposition()!="attachment":
            continue
        filename=decode(filename or f"attachment-{n}")
        safe=re.sub(r"[^A-Za-z0-9._-]+","_",filename).strip("_")
        path=ATTACH/f"{n:02d}_{safe}"
        path.write_bytes(part.get_payload(decode=True) or b"")
        if path.suffix.lower()==".pdf":
            receipts.append(parse_receipt(path,meta))

jobs,leads=load_leadflow()
for receipt in receipts:
    receipt["match"]=propose_matches(receipt,jobs,leads)

summary={
    "input":str(INPUT),
    "receipt_count":len(receipts),
    "total_amount":str(sum(Decimal(r["total"] or 0) for r in receipts).quantize(Decimal("0.01"))),
    "matched":sum(r["match"]["status"]=="matched" for r in receipts),
    "lead_only":sum(r["match"]["status"]=="lead-only" for r in receipts),
    "unmatched_or_review":sum(r["match"]["status"] in ("unmatched","needs-review") for r in receipts),
    "database_writes":0,
}
result={"summary":summary,"receipts":receipts}
(OUT/"parsed_and_matched.json").write_text(json.dumps(result,indent=2,default=str))
print(json.dumps(summary,indent=2))
for r in receipts:
    m=r["match"]
    print(r["file"],r["purchase_at"],r["po_job_name"],r["total"],m["status"],m["job_id"],m["reason"])

import "server-only";

import { pool } from "@/db";

let ready = false;

export async function ensureInvoiceAmountAdjustmentsTable(): Promise<void> {
  if (ready) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoice_amount_adjustments (
      id serial PRIMARY KEY,
      org_id integer NOT NULL,
      invoice_id integer NOT NULL,
      adjustment_type varchar(32) NOT NULL,
      invoice_status varchar(20) NOT NULL,
      old_amount numeric(12,2) NOT NULL,
      new_amount numeric(12,2) NOT NULL,
      final_amount_after numeric(12,2) NOT NULL,
      reason text NOT NULL,
      changed_by_id integer NOT NULL,
      changed_by_name varchar(120) NOT NULL,
      changed_by_email varchar(190) NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS invoice_amount_adjustments_org_invoice_idx
      ON invoice_amount_adjustments (org_id, invoice_id);
    CREATE INDEX IF NOT EXISTS invoice_amount_adjustments_created_idx
      ON invoice_amount_adjustments (org_id, created_at);
  `);
  ready = true;
}

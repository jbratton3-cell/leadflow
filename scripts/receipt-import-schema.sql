-- Private receipt-parser inbox and attachment store.
-- Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS receipt_imports (
  id serial PRIMARY KEY,
  org_id integer NOT NULL,
  expense_id integer REFERENCES expenses(id) ON DELETE SET NULL,
  job_id integer,
  source varchar(50) NOT NULL DEFAULT 'home_depot_gmail',
  message_id text,
  email_subject text,
  order_number varchar(80),
  receipt_sha256 varchar(64) NOT NULL,
  file_name varchar(255) NOT NULL,
  mime_type varchar(120) NOT NULL,
  size_bytes integer NOT NULL,
  file_data bytea NOT NULL,
  purchase_date timestamp,
  vendor varchar(160),
  subtotal numeric(12,2),
  tax numeric(12,2),
  total numeric(12,2),
  po_job_name varchar(240),
  items_json text,
  status varchar(30) NOT NULL DEFAULT 'review',
  match_reason text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS receipt_imports_org_hash_uidx
  ON receipt_imports(org_id, receipt_sha256);
CREATE INDEX IF NOT EXISTS receipt_imports_org_status_idx
  ON receipt_imports(org_id, status);
CREATE INDEX IF NOT EXISTS receipt_imports_expense_idx
  ON receipt_imports(expense_id);
CREATE INDEX IF NOT EXISTS receipt_imports_order_idx
  ON receipt_imports(org_id, order_number);

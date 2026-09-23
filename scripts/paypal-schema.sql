-- LeadFlow PayPal payment audit fields. Safe to run more than once.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_order_id varchar(40);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_capture_id varchar(40);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_status varchar(30);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_payment_source varchar(30);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_payer_email varchar(190);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paypal_fee_amount numeric(12,2);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_paypal_order_unique
  ON invoices(paypal_order_id)
  WHERE paypal_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_paypal_capture_unique
  ON invoices(paypal_capture_id)
  WHERE paypal_capture_id IS NOT NULL;

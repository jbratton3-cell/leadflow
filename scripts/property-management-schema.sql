-- Property-management account hierarchy and service-location links.
-- Safe to run more than once.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_name varchar(160);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS unit_number varchar(40);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_name varchar(160);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_phone varchar(40);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_email varchar(190);

-- Existing rows were created when "name" always meant property/community name.
UPDATE properties
SET property_name = name
WHERE property_name IS NULL
  AND name IS NOT NULL;

ALTER TABLE estimates ADD COLUMN IF NOT EXISTS property_id integer;
ALTER TABLE estimates ADD COLUMN IF NOT EXISTS unit_number varchar(40);
CREATE INDEX IF NOT EXISTS estimates_property_idx ON estimates(property_id);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS estimate_id integer;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS property_id integer;
CREATE INDEX IF NOT EXISTS sales_property_idx ON sales(property_id);
CREATE UNIQUE INDEX IF NOT EXISTS sales_estimate_unique
  ON sales(org_id, estimate_id)
  WHERE estimate_id IS NOT NULL;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS property_id integer;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS unit_number varchar(40);
CREATE INDEX IF NOT EXISTS invoices_property_idx ON invoices(property_id);

CREATE INDEX IF NOT EXISTS jobs_property_idx ON jobs(property_id);

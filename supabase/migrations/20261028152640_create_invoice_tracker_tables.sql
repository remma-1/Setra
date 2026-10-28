/*
# Create invoice and shipment tracker tables

1. New Tables
- `invoice_records` stores invoice-level shipment information.
  - `id` unique invoice identifier.
  - `invoice_type` document type such as Invoice, Credit Note, or Proforma.
  - `document_number` document reference.
  - `amount` optional total amount.
  - `document_date` document date.
  - `awb_bl` airway bill or bill of lading reference.
  - `company_name` supplier or company name.
  - `eta_date` expected order arrival date.
  - `warehouse_arrival_date` expected warehouse arrival date.
  - `link` optional source document URL.
  - `remarks` optional notes.
  - `received` whether an invoice without item rows has been received.
  - `created_at` and `updated_at` timestamps.
- `invoice_items` stores line items attached to an invoice.
  - `id` unique item identifier.
  - `invoice_id` parent invoice reference.
  - `item_name` item description.
  - `quantity` optional quantity.
  - `received` whether this item has been received.
  - `note` optional item note.
- `invoice_catalog` stores reusable company and item names for the settings screen.
  - `id` unique catalog identifier.
  - `kind` either `company` or `item`.
  - `name` reusable name.
  - `created_at` timestamp.

2. Security
- Enable row-level security on every new table.
- Grant CRUD access to anon and authenticated roles for this intentionally shared workspace.
- Add separate policies for each CRUD operation.

3. Seed Data
- Add realistic invoice, item, company, and item catalog records only when the new tables are empty.
- The records are shared because this first version has no sign-in screen.
*/

CREATE TABLE IF NOT EXISTS public.invoice_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type text NOT NULL DEFAULT 'Invoice' CHECK (invoice_type IN ('Invoice', 'Credit Note', 'Proforma')),
  document_number text NOT NULL,
  amount numeric(14, 2),
  document_date date,
  awb_bl text,
  company_name text NOT NULL,
  eta_date date,
  warehouse_arrival_date date,
  link text,
  remarks text,
  received boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoice_records(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity numeric(14, 3),
  received boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('company', 'item')),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, name)
);

ALTER TABLE public.invoice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_catalog ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_records TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_catalog TO anon, authenticated;

DROP POLICY IF EXISTS "Shared workspace can read invoice records" ON public.invoice_records;
CREATE POLICY "Shared workspace can read invoice records" ON public.invoice_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared workspace can add invoice records" ON public.invoice_records;
CREATE POLICY "Shared workspace can add invoice records" ON public.invoice_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can edit invoice records" ON public.invoice_records;
CREATE POLICY "Shared workspace can edit invoice records" ON public.invoice_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can remove invoice records" ON public.invoice_records;
CREATE POLICY "Shared workspace can remove invoice records" ON public.invoice_records FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Shared workspace can read invoice items" ON public.invoice_items;
CREATE POLICY "Shared workspace can read invoice items" ON public.invoice_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared workspace can add invoice items" ON public.invoice_items;
CREATE POLICY "Shared workspace can add invoice items" ON public.invoice_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can edit invoice items" ON public.invoice_items;
CREATE POLICY "Shared workspace can edit invoice items" ON public.invoice_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can remove invoice items" ON public.invoice_items;
CREATE POLICY "Shared workspace can remove invoice items" ON public.invoice_items FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Shared workspace can read invoice catalog" ON public.invoice_catalog;
CREATE POLICY "Shared workspace can read invoice catalog" ON public.invoice_catalog FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Shared workspace can add invoice catalog" ON public.invoice_catalog;
CREATE POLICY "Shared workspace can add invoice catalog" ON public.invoice_catalog FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can edit invoice catalog" ON public.invoice_catalog;
CREATE POLICY "Shared workspace can edit invoice catalog" ON public.invoice_catalog FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Shared workspace can remove invoice catalog" ON public.invoice_catalog;
CREATE POLICY "Shared workspace can remove invoice catalog" ON public.invoice_catalog FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS invoice_records_warehouse_arrival_idx ON public.invoice_records (warehouse_arrival_date);
CREATE INDEX IF NOT EXISTS invoice_records_company_idx ON public.invoice_records (company_name);
CREATE INDEX IF NOT EXISTS invoice_records_document_idx ON public.invoice_records (document_number);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON public.invoice_items (invoice_id);

INSERT INTO public.invoice_catalog (kind, name)
SELECT 'company', 'Gulf Industrial Supplies' WHERE NOT EXISTS (SELECT 1 FROM public.invoice_catalog WHERE kind = 'company');
INSERT INTO public.invoice_catalog (kind, name)
SELECT 'company', 'Atlas Logistics' WHERE NOT EXISTS (SELECT 1 FROM public.invoice_catalog WHERE kind = 'company' AND name = 'Atlas Logistics');
INSERT INTO public.invoice_catalog (kind, name)
SELECT 'company', 'Nile Equipment Co.' WHERE NOT EXISTS (SELECT 1 FROM public.invoice_catalog WHERE kind = 'company' AND name = 'Nile Equipment Co.');
INSERT INTO public.invoice_catalog (kind, name)
SELECT 'item', 'Hydraulic filter' WHERE NOT EXISTS (SELECT 1 FROM public.invoice_catalog WHERE kind = 'item');
INSERT INTO public.invoice_catalog (kind, name)
SELECT 'item', 'Control panel assembly' WHERE NOT EXISTS (SELECT 1 FROM public.invoice_catalog WHERE kind = 'item' AND name = 'Control panel assembly');
INSERT INTO public.invoice_catalog (kind, name)
SELECT 'item', 'Replacement seals' WHERE NOT EXISTS (SELECT 1 FROM public.invoice_catalog WHERE kind = 'item' AND name = 'Replacement seals');

INSERT INTO public.invoice_records (invoice_type, document_number, amount, document_date, awb_bl, company_name, eta_date, warehouse_arrival_date, link, remarks)
SELECT 'Invoice', 'INV-2026-0418', 18450.00, CURRENT_DATE - 3, 'MAWB 176-9081 4420', 'Gulf Industrial Supplies', CURRENT_DATE + 4, CURRENT_DATE + 8, 'https://example.com/invoices/INV-2026-0418', 'Priority spare parts for the west plant.'
WHERE NOT EXISTS (SELECT 1 FROM public.invoice_records);
INSERT INTO public.invoice_records (invoice_type, document_number, amount, document_date, awb_bl, company_name, eta_date, warehouse_arrival_date, remarks)
SELECT 'Proforma', 'PF-2026-0097', 7280.50, CURRENT_DATE - 1, 'BL 9084-PL', 'Atlas Logistics', CURRENT_DATE + 1, CURRENT_DATE + 3, 'Awaiting the final packing list.'
WHERE NOT EXISTS (SELECT 1 FROM public.invoice_records WHERE document_number = 'PF-2026-0097');
INSERT INTO public.invoice_records (invoice_type, document_number, amount, document_date, awb_bl, company_name, eta_date, warehouse_arrival_date, received, remarks)
SELECT 'Invoice', 'INV-2026-0399', 4210.00, CURRENT_DATE - 12, 'MAWB 176-9012 8831', 'Nile Equipment Co.', CURRENT_DATE - 4, CURRENT_DATE - 2, true, 'Received and filed.'
WHERE NOT EXISTS (SELECT 1 FROM public.invoice_records WHERE document_number = 'INV-2026-0399');

INSERT INTO public.invoice_items (invoice_id, item_name, quantity, received, note)
SELECT r.id, 'Hydraulic filter', 24, false, 'Confirm filter grade on arrival.' FROM public.invoice_records r WHERE r.document_number = 'INV-2026-0418' AND NOT EXISTS (SELECT 1 FROM public.invoice_items i WHERE i.invoice_id = r.id);
INSERT INTO public.invoice_items (invoice_id, item_name, quantity, received, note)
SELECT r.id, 'Control panel assembly', 2, false, 'Handle with care.' FROM public.invoice_records r WHERE r.document_number = 'PF-2026-0097' AND NOT EXISTS (SELECT 1 FROM public.invoice_items i WHERE i.invoice_id = r.id);
INSERT INTO public.invoice_items (invoice_id, item_name, quantity, received, note)
SELECT r.id, 'Replacement seals', 60, true, 'Stored in receiving bay.' FROM public.invoice_records r WHERE r.document_number = 'INV-2026-0399' AND NOT EXISTS (SELECT 1 FROM public.invoice_items i WHERE i.invoice_id = r.id);
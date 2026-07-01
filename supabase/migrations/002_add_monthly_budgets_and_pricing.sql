-- 1. Add pricing columns to support financial tracking
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;
ALTER TABLE public.usage_logs ADD COLUMN IF NOT EXISTS usage_cost numeric DEFAULT 0;

-- 2. Create the monthly_budgets table
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- Format: YYYY-MM
  student_count integer NOT NULL DEFAULT 0,
  budget_per_student numeric NOT NULL DEFAULT 2050,
  total_budget numeric GENERATED ALWAYS AS (student_count * budget_per_student) STORED,
  status text NOT NULL DEFAULT 'pending', -- 'pending' or 'approved'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(school_id, month_year)
);

-- 3. Update current_stock_view to include unit_price
DROP VIEW IF EXISTS public.current_stock_view;
CREATE OR REPLACE VIEW public.current_stock_view AS
SELECT 
    i.school_id,
    i.id AS item_id,
    i.name_en,
    i.name_ta,
    CASE 
        WHEN i.name_ta IS NULL OR i.name_ta = '' THEN i.name_en 
        ELSE i.name_en || ' (' || i.name_ta || ')' 
    END AS item_name,
    i.category,
    i.unit,
    i.image_url,
    i.threshold_qty,
    i.estimated_cost,
    i.unit_price,
    COALESCE(st.total_added, 0) - COALESCE(ut.total_used, 0) AS current_stock
FROM public.inventory_items i
LEFT JOIN public.stock_totals st ON st.item_id = i.id
LEFT JOIN public.usage_totals ut ON ut.item_id = i.id
WHERE i.is_active = true;

GRANT SELECT ON public.current_stock_view TO authenticated;

-- 4. Enable RLS and setup policies for monthly_budgets
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on monthly_budgets" 
ON public.monthly_budgets 
FOR ALL 
USING (public.get_my_role() = 'ngo_admin');

CREATE POLICY "School staff can view their own monthly_budgets" 
ON public.monthly_budgets 
FOR SELECT 
USING (public.get_my_school_id() = school_id);

CREATE POLICY "School staff can insert their own monthly_budgets" 
ON public.monthly_budgets 
FOR INSERT 
WITH CHECK (public.get_my_school_id() = school_id AND public.get_my_role() = 'school_staff');

CREATE POLICY "School staff can update their own monthly_budgets" 
ON public.monthly_budgets 
FOR UPDATE 
USING (public.get_my_school_id() = school_id AND public.get_my_role() = 'school_staff');

-- Trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_budgets_modtime
BEFORE UPDATE ON public.monthly_budgets
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

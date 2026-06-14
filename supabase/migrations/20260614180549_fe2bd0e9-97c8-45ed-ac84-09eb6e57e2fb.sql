
CREATE OR REPLACE FUNCTION public.tg_adjust_material_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta NUMERIC := 0;
  new_qty NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'canceled' THEN
      delta := -NEW.requested_quantity;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Was holding inventory before?
    IF OLD.status <> 'canceled' AND NEW.status = 'canceled' THEN
      delta := OLD.requested_quantity; -- return units
    ELSIF OLD.status = 'canceled' AND NEW.status <> 'canceled' THEN
      delta := -NEW.requested_quantity; -- reserve again
    ELSIF OLD.status <> 'canceled' AND NEW.status <> 'canceled'
          AND NEW.requested_quantity <> OLD.requested_quantity THEN
      delta := OLD.requested_quantity - NEW.requested_quantity;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'canceled' THEN
      delta := OLD.requested_quantity;
    END IF;
  END IF;

  IF delta = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.materials
     SET quantity = quantity + delta,
         status = CASE
           WHEN quantity + delta <= 0 THEN 'claimed'::material_status
           WHEN status = 'claimed' AND quantity + delta > 0 THEN 'available'::material_status
           ELSE status
         END
   WHERE id = COALESCE(NEW.material_id, OLD.material_id)
   RETURNING quantity INTO new_qty;

  IF new_qty < 0 THEN
    RAISE EXCEPTION 'Requested quantity exceeds available stock';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_material_qty_ins ON public.transactions;
DROP TRIGGER IF EXISTS trg_adjust_material_qty_upd ON public.transactions;
DROP TRIGGER IF EXISTS trg_adjust_material_qty_del ON public.transactions;

CREATE TRIGGER trg_adjust_material_qty_ins
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_adjust_material_quantity();

CREATE TRIGGER trg_adjust_material_qty_upd
AFTER UPDATE OF status, requested_quantity ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_adjust_material_quantity();

CREATE TRIGGER trg_adjust_material_qty_del
AFTER DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_adjust_material_quantity();

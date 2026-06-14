
-- Notify contractor on new transaction (donation request)
CREATE OR REPLACE FUNCTION public.tg_notify_new_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mat_title TEXT;
BEGIN
  SELECT title INTO mat_title FROM public.materials WHERE id = NEW.material_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.contractor_id,
    'transaction_new',
    'New donation request',
    'Someone requested "' || COALESCE(mat_title, 'a material') || '".',
    '/transactions/' || NEW.id::text
  );
  -- also confirm to recipient
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.recipient_id,
    'transaction_created',
    'Request submitted',
    'Your request for "' || COALESCE(mat_title, 'a material') || '" was submitted.',
    '/transactions/' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_transaction ON public.transactions;
CREATE TRIGGER trg_notify_new_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_new_transaction();

-- Notify both parties on status change
CREATE OR REPLACE FUNCTION public.tg_notify_transaction_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mat_title TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO mat_title FROM public.materials WHERE id = NEW.material_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.contractor_id,
      'transaction_status',
      'Donation ' || NEW.status,
      'Status of "' || COALESCE(mat_title, 'donation') || '" is now ' || NEW.status || '.',
      '/transactions/' || NEW.id::text
    );
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.recipient_id,
      'transaction_status',
      'Request ' || NEW.status,
      'Your request for "' || COALESCE(mat_title, 'a material') || '" is now ' || NEW.status || '.',
      '/transactions/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_transaction_status ON public.transactions;
CREATE TRIGGER trg_notify_transaction_status
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_transaction_status();

-- Notify the OTHER party on new message
CREATE OR REPLACE FUNCTION public.tg_notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_id UUID;
  r_id UUID;
  recipient UUID;
BEGIN
  SELECT contractor_id, recipient_id INTO c_id, r_id
  FROM public.transactions WHERE id = NEW.transaction_id;
  recipient := CASE WHEN NEW.sender_id = c_id THEN r_id ELSE c_id END;
  IF recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      recipient,
      'message_new',
      'New message',
      LEFT(NEW.body, 140),
      '/transactions/' || NEW.transaction_id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_new_message();


REVOKE EXECUTE ON FUNCTION public.tg_notify_new_transaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_transaction_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_new_message() FROM PUBLIC, anon, authenticated;

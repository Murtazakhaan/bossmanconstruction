
CREATE POLICY "Parties can subscribe to transactions table changes"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'realtime:%transactions%'
  AND EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.contractor_id = auth.uid()
       OR t.recipient_id = auth.uid()
       OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

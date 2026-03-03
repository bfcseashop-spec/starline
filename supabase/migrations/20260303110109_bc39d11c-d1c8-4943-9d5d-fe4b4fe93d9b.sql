-- Allow customers to insert their own payments
CREATE POLICY "Customers can insert own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
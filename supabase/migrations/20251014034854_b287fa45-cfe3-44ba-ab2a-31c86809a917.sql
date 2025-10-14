-- Add explicit DENY policies to prevent role modifications
-- This prevents privilege escalation attacks

CREATE POLICY "No one can update roles"
  ON public.user_roles FOR UPDATE
  USING (false);

CREATE POLICY "No one can delete roles"
  ON public.user_roles FOR DELETE
  USING (false);
-- Fix messages table to use thread_id as the primary foreign key
-- Remove match_id foreign key constraint
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_match_id_fkey;

-- Make thread_id NOT NULL (it should always have a thread)
ALTER TABLE public.messages ALTER COLUMN thread_id SET NOT NULL;

-- Make match_id nullable (it's not needed anymore)
ALTER TABLE public.messages ALTER COLUMN match_id DROP NOT NULL;

-- Add index on thread_id for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id_created_at ON public.messages(thread_id, created_at DESC);

-- Update RLS policies to work with thread_id
DROP POLICY IF EXISTS "Users can insert messages in own threads" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in own threads" ON public.messages;

CREATE POLICY "Users can insert messages in own threads"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_user_id AND
  EXISTS (
    SELECT 1 FROM public.threads
    WHERE threads.id = messages.thread_id
    AND (threads.creator_user_id = auth.uid() OR threads.client_user_id = auth.uid())
  )
);

CREATE POLICY "Users can view messages in own threads"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.threads
    WHERE threads.id = messages.thread_id
    AND (threads.creator_user_id = auth.uid() OR threads.client_user_id = auth.uid())
  )
);
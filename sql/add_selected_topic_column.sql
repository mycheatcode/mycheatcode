-- Add selected_topic column to chats table
-- This stores the topic information selected during onboarding or when starting a chat

ALTER TABLE public.chats
ADD COLUMN IF NOT EXISTS selected_topic JSONB DEFAULT NULL;

COMMENT ON COLUMN public.chats.selected_topic IS 'Stores the selected topic metadata (id, title, description, etc.) for the chat session';

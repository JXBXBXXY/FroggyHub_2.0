-- Drop old uniqueness constraint on host/date/title
DROP INDEX IF EXISTS events_host_datetime_title_key;
-- Ensure code is unique
CREATE UNIQUE INDEX IF NOT EXISTS events_code_key ON public.events (code);

-- Wishlist items: ensure event_id with cascade
ALTER TABLE public.wishlist_items
  ADD COLUMN IF NOT EXISTS event_id int REFERENCES public.events(id) ON DELETE CASCADE;

-- Guests table adjustments
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS event_id int REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS rsvp text CHECK (rsvp IN ('yes','maybe','no')) DEFAULT NULL;

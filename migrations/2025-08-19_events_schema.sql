CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  host_user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  date date,
  time text,
  address text,
  dress text,
  bring text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  claimed_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  rsvp text,
  created_at timestamptz DEFAULT now()
);

NOTIFY pgrst, 'reload schema';

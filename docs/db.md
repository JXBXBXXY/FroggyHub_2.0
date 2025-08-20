## Database Setup

To create the base tables in a new project:

1. Open the Supabase SQL Editor.
2. Copy the contents of `migrations/2025-08-19_events_schema.sql` and run them.

Netlify functions use the `SERVICE_ROLE` key, so row level security is not required for these tables.

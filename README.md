# FroggyHub

## Database schema
The `supabase.sql` file contains migrations for the project. It creates the following tables with Row Level Security (RLS):

- **profiles** – user profiles linked to `auth.users`. Only the owner can read or modify their profile.
- **events** – events owned by a profile. Policies allow owners to manage their events and participants to read them.
- **participants** – relation between users and events. Users can access only rows for themselves.
- **wishlist_items** – wishlist entries for an event. Owners can edit their own items, and participants may reserve gifts.
- **cookie_consents** – stores a boolean consent flag per user.

Run the script against your Supabase project to set up the database and policies:

```sql
psql "$SUPABASE_DB_URL" < supabase.sql
```

## Netlify functions
Two serverless functions use the service role key to interact with Supabase:

- `api/join-by-code.js` – joins the current user to an event by code.
- `api/event-by-code.js` – returns event information, participants and wishlist.

Configure the connection credentials in `netlify.toml`:

```toml
[build.environment]
SUPABASE_URL = "..."
SUPABASE_SERVICE_ROLE_KEY = "..."
```

## Cookie consent
A simple banner is rendered at the bottom of the page asking the visitor to accept or decline cookies. The choice is stored in `localStorage` and synchronised with the `cookie_consents` table when the user is authenticated. Declining removes optional scripts such as analytics.

## Development
1. Install dependencies: `npm install`.
2. Run tests and lint: `npm test`.
3. Start local development with Netlify: `npm run dev`.

## Testing checklist
- Apply the SQL migrations.
- Create users and profiles, create an event, join via code from another user.
- Verify wishlist reservations and RLS rules for non-participants.
- Check that cookie consent is saved and synced after sign in/out.
- Removing an event should cascade to participants and wishlist items.

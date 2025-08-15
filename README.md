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

## Regional connectivity & proxy

Some regions block direct access to `*.supabase.co`. The app can automatically fall back to a proxied endpoint.

- `PROXY_SUPABASE_URL` points to `/supabase` which is proxied to the original project through Netlify `_redirects`.
- On start the client performs a quick health probe to `SUPABASE_URL`. If it fails within 1500 ms, the client re‑initialises with the proxy URL and stores the choice in `sessionStorage`.
- Auth, REST, Storage and Functions requests are proxied; Realtime can also be proxied through an optional edge function.
- The proxy must not expose a `SERVICE_ROLE` key – only the anonymous key is used in the browser.
- To disable the proxy, remove the fallback code and the `/supabase` rules when regional restrictions are not an issue.

## Email confirmation

- Enable at **Project Settings → Auth → Email confirmations** in Supabase.
- When enabled, a session is not created until the user clicks the link in the email.
- **Redirect URLs** must include `https://froggyhubapp.netlify.app` and preview domains.
- Emails may arrive with a delay – the UI must not wait for the session.

## Testing checklist
- Apply the SQL migrations.
- Create users and profiles, create an event, join via code from another user.
- Verify wishlist reservations and RLS rules for non-participants.
- Check that cookie consent is saved and synced after sign in/out.
- Removing an event should cascade to participants and wishlist items.
- Creating an event while logged out shows a warning and does not throw errors.
- Creating an event right after logging in succeeds and sets `owner_id` to the current user.
- After the session expires, clicking “Сгенерировать код” should prompt the user to sign in again.

## Auth smoke tests

- Password login on the direct Supabase domain leads to the lobby.
- When `supabase.co` is blocked, the first login attempt fails, the client switches to `/supabase` and the second attempt succeeds.
- Sign-up with email confirmation enabled shows a “Check your inbox” message; after confirming, the session is established.
- Logging in via email link (OTP) creates a session without a password.
- Reloading the page preserves the session (`persistSession=true`).
- Reset password flow sends email and successfully updates the password.
- Resend confirmation email works when the initial link expires.
- `autoRefreshToken` keeps the session alive for over an hour during activity.
- Throttling limits password attempts and falls back to OTP after repeated failures.
- Logout clears session, temp data and proxy mode.
- Registration with confirmation **OFF** creates a session immediately, upserts profile and redirects to the lobby.
- Registration with confirmation **ON** shows the “Check your inbox” screen and a “Resend” button without hanging.
- Mobile users in restricted regions hit a timeout first, switch to the proxy and complete registration or email delivery.
- Cancelling during “Регистрируем…” returns the UI to idle state.

## Быстрый чек авторизации

- Переключение «Регистрация» → кнопка кликается, активируется только при валидных полях.
- Логин: при неверном пароле — кнопка возвращается из «Входим…».
- Таймаут сети → кнопка не зависает, срабатывает прокси‑ретрай один раз.
- Баннер cookies скрыт → форма кликабельна.
- На мобиле вкладки меняются, всё кликается.

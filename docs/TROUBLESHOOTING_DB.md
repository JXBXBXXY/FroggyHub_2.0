# DB Troubleshooting

## Error: `password authentication failed` (Postgres code 28P01)

Причина: неверный пароль в `DATABASE_URL`.

### Как исправить (Neon)
1. Открой Neon → **Roles** → выбери нужную роль (например, `neondb_owner`) → **Reset password**.
2. Перейди Neon → **Connect** → скопируй **Connection string (URI)**.
   - ДОЛЖНО БЫТЬ: `postgresql://USER:PASS@HOST/DB?sslmode=require&channel_binding=require`
   - НЕЛЬЗЯ: `psql 'postgresql://…'` (это CLI-команда; не вставляй `psql` и кавычки)
3. Netlify → **Site settings → Environment variables** → замени `DATABASE_URL` во **всех** контекстах  
   (Production, Deploy Previews, Branch).
4. Нажми **Trigger deploy**.

### Проверка
- `/.netlify/functions/db-url-check` — парсинг `DATABASE_URL` (пароль скрыт): протокол `postgres`/`postgresql`, хост `*.neon.tech`, `hasPassword=true`, в `search` есть `sslmode=require`.
- `/.netlify/functions/db-whoami` — успешное подключение вернёт `{ ok:true, current_user, db, host }`.  
  При ошибке 28P01 вернётся дружелюбный JSON с подсказкой.

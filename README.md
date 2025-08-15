# FroggyHub

## Cookies & Consent

- **Хранение.** Выбор пользователя сохраняется в таблице `cookie_consents`. Поля: `id` UUID, `user_id` UUID, `choice` JSONB вроде `{ "necessary": true, "analytics": false }`, `consented_at` время согласия.
- **RLS.** Включена проверка `auth.uid() = user_id`, поэтому даже с anon‑ключом клиент видит только свою запись.
- **Аналитика.** Функция `applyCookieChoice` подключает или удаляет аналитические скрипты без перезагрузки. При изменении выбора просто вызывайте её снова.
- **Удаление данных.** По запросу пользователя удалите строку `delete from cookie_consents where user_id = '<uuid>'`.


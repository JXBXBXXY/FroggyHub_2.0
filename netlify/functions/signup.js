const { Client } = require('pg')
const bcrypt = require('bcryptjs')
const { ok, err, cors } = require('./_util')

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' }
    if (event.httpMethod !== 'POST') return err('Method not allowed', 405)

    const { nickname, password } = JSON.parse(event.body || '{}')
    if (!nickname || !password) return err('Нужно указать логин и пароль', 400)

    const password_hash = await bcrypt.hash(password, 10)

    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL })
    await client.connect()
    await client.query(
      'INSERT INTO public.users_local (nickname, password_hash) VALUES ($1, $2)',
      [nickname, password_hash]
    )
    await client.end()

    return ok({ ok: true, message: 'Регистрация успешна' })
  } catch (e) {
    console.error(e)
    if (e && e.code === '23505') return err('Такой ник уже есть', 400)
    return err('Ошибка регистрации', 400)
  }
}

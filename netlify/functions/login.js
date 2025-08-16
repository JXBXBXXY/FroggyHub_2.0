const { Client } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { ok, err, cors } = require('./_util')

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' }
    if (event.httpMethod !== 'POST') return err('Method not allowed', 405)

    const { nickname, password } = JSON.parse(event.body || '{}')
    if (!nickname || !password) return err('Нужно указать логин и пароль', 400)

    const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL })
    await client.connect()
    const { rows } = await client.query(
      'SELECT id, nickname, password_hash FROM public.users_local WHERE nickname=$1 LIMIT 1',
      [nickname]
    )
    await client.end()

    const user = rows[0]
    if (!user) return err('Пользователь не найден', 401)

    const okPass = await bcrypt.compare(password, user.password_hash)
    if (!okPass) return err('Неверный пароль', 401)

    const token = jwt.sign(
      { sub: user.id, nickname: user.nickname },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return ok({ ok: true, token, user: { id: user.id, nickname: user.nickname } })
  } catch (e) {
    console.error(e)
    return err('Ошибка входа', 500)
  }
}

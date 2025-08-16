exports.cors = (extra = {}) => ({
  'Access-Control-Allow-Origin': 'https://froggyhubapp.netlify.app',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  ...extra
})
exports.ok = (body, status = 200) => ({
  statusCode: status,
  headers: exports.cors(),
  body: JSON.stringify(body)
})
exports.err = (message, status = 400) => ({
  statusCode: status,
  headers: exports.cors(),
  body: JSON.stringify({ message })
})

#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://127.0.0.1:9999}"

# 1. diag-auth
printf '\n==> diag-auth\n'
curl -sS "$BASE/.netlify/functions/diag-auth" || true

# 2. signup
nick="frog_$RANDOM"
pass="pass123"
printf '\n==> signup %s\n' "$nick"
resp=$(curl -sS -w '\n%{http_code}' -H 'Content-Type: application/json' \
  -d "{\"nickname\":\"$nick\",\"password\":\"$pass\"}" \
  "$BASE/.netlify/functions/local-signup")
code=$(tail -n1 <<<"$resp")
body=$(sed '$d' <<<"$resp")
echo "HTTP $code"
echo "$body"

# 3. login
printf '\n==> login %s\n' "$nick"
resp=$(curl -sS -w '\n%{http_code}' -H 'Content-Type: application/json' \
  -d "{\"nickname\":\"$nick\",\"password\":\"$pass\"}" \
  "$BASE/.netlify/functions/local-login")
code=$(tail -n1 <<<"$resp")
body=$(sed '$d' <<<"$resp")
echo "HTTP $code"
echo "$body"
if command -v jq >/dev/null 2>&1; then
  token=$(echo "$body" | jq -r '.token')
else
  token=$(echo "$body" | grep -o '"token"[^"]*"[^"]*"' | sed 's/.*"token"[^"]*"\([^"]*\)".*/\1/')
fi

# 4. profile
printf '\n==> profile\n'
resp=$(curl -sS -w '\n%{http_code}' -H "Authorization: Bearer $token" \
  "$BASE/.netlify/functions/profile")
code=$(tail -n1 <<<"$resp")
body=$(sed '$d' <<<"$resp")
echo "HTTP $code"
echo "$body"

# Todo App — Authentication

Email/password registration and login with database-backed accounts and signed JWT access tokens.

## Requirements

- Node.js 22 or later and npm
- A JWT signing secret of at least 32 bytes
- SQLite by default, or MySQL when `MYSQL_HOST` is configured

## Run locally

1. Copy `.env.example` to `.env` and set a unique `JWT_SECRET` (for example, generate one with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`).
2. Install dependencies with `npm install --prefix backend` and `npm install --prefix client`.
3. Start the API with `npm start --prefix backend`.
4. In another terminal, start the UI with `npm run dev --prefix client` and open the URL printed by Vite.

The API creates the `users` table on startup. By default it uses `backend/data/todo.db`; set `SQLITE_DB_LOCATION` to change the SQLite file. To use MySQL, configure `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DB`.

## Authentication API

### Register

`POST /api/auth/register`

```json
{"email":"you@example.com","password":"at-least-8-characters"}
```

Returns `201 Created` with a signed bearer token and public user details. Duplicate email addresses return `409`; malformed email addresses or passwords return `400`.

### Sign in

`POST /api/auth/login` accepts the same JSON body and returns `200 OK` with a signed bearer token. Invalid credentials return a generic `401` response.

Successful responses contain `token`, `tokenType` (`Bearer`), `expiresIn` (seconds), and `user` (`id`, `email`). Tokens use HS256, identify the account in `sub`, and expire after one hour. Passwords are stored as bcrypt hashes and never returned. Keep `JWT_SECRET` private and use HTTPS in deployed environments.

The current UI keeps the issued token in memory and shows a signed-in confirmation; persistent sessions and authenticated Todo endpoints are not part of this issue.

## Tests and build

- `npm test --prefix backend`
- `npm run build --prefix client`

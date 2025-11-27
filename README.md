# Permalist (Multi-User To-Do)

Express + PostgreSQL to-do list that supports multiple users, with per-user accent color and scoped CRUD on items.

## Setup

1) Install dependencies  
```
npm install
```

2) Create `.env` in the project root (do not commit):  
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=permalist
DB_PASS=yourpassword
DB_PORT=5432
```

3) Create the database and tables (psql):  
```
CREATE DATABASE permalist;
\c permalist
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#a683e3'
);
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  user_id INT REFERENCES users(id)
);
INSERT INTO users (name, color) VALUES ('Me', '#a683e3');
```

## Run

```
npm start
# or choose another port:
# PORT=3001 npm start
```

Open `http://localhost:3000` (or your chosen port).

## Features

- Switch between users; each user sees only their items.
- Add/edit/delete items scoped to the active user.
- Create new users with a chosen accent color; UI theme follows the selected user.
- Rename users if needed.

## Notes

- `.env` and `node_modules` are git-ignored.  
- If port 3000 is busy, set `PORT` before starting.  
- DB credentials are loaded from `.env` via `dotenv`.

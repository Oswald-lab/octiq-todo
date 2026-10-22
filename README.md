# Cmv71owt7lf1h01n3007f

**Application name:** Todo App

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- npm v10+

## Getting Started

### 1. Configure environment

```bash
cp .env.example .env
```

Open `.env` and update the values as required (JWT secrets, database URL, etc.).

### 2. Install and run

```bash
npm install
npm run dev
```

Backend runs on **http://localhost:4001**, frontend on **http://localhost:5173**

The SQLite database is stored at `data/app.db`. The database and tables are created automatically on first run — you do not need to run migrations manually. If you do want to run migrations separately:

```bash
npm run db:migrate
```

> **Note:** Running `db:migrate` on an existing database (where tables already exist) will fail. Only run it on a fresh database.

## Build for Production

```bash
npm run build

# Preview the production build
npm run preview
```


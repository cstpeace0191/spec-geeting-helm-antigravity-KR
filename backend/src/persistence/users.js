const path = require('node:path');
const fs = require('node:fs/promises');
const sqlite3 = require('sqlite3');
const mysql = require('mysql2/promise');

async function createSqliteUserStore(databaseLocation) {
  const filename = databaseLocation || path.join(__dirname, '../../data/todo.db');
  if (filename !== ':memory:') {
    await fs.mkdir(path.dirname(path.resolve(filename)), { recursive: true });
  }

  const db = await new Promise((resolve, reject) => {
    const connection = new sqlite3.Database(filename, (error) => {
      if (error) reject(error);
      else resolve(connection);
    });
  });

  await new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(254) NOT NULL UNIQUE COLLATE NOCASE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TEXT NOT NULL
      )`,
      (error) => (error ? reject(error) : resolve()),
    );
  });

  return {
    findByEmail(email) {
      return new Promise((resolve, reject) => {
        db.get('SELECT id, email, password_hash FROM users WHERE email = ?', [email], (error, row) => {
          if (error) reject(error);
          else resolve(row || null);
        });
      });
    },
    create(user) {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
          [user.id, user.email, user.passwordHash, user.createdAt],
          (error) => (error ? reject(error) : resolve()),
        );
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        db.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

async function createMysqlUserStore(env = process.env) {
  const pool = mysql.createPool({
    host: env.MYSQL_HOST,
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  return {
    async findByEmail(email) {
      const [rows] = await pool.execute(
        'SELECT id, email, password_hash FROM users WHERE email = ?',
        [email],
      );
      return rows[0] || null;
    },
    async create(user) {
      await pool.execute(
        'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
        [user.id, user.email, user.passwordHash, user.createdAt],
      );
    },
    close() {
      return pool.end();
    },
  };
}

async function createUserStore(env = process.env) {
  if (env.MYSQL_HOST) return createMysqlUserStore(env);
  return createSqliteUserStore(env.SQLITE_DB_LOCATION);
}

module.exports = { createUserStore, createSqliteUserStore };
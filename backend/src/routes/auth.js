const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_LIFETIME = '1h';

function isDuplicateEmailError(error) {
  return error.code === 'SQLITE_CONSTRAINT' || error.code === 'ER_DUP_ENTRY';
}

function createAuthRouter({ userStore, jwtSecret }) {
  const router = express.Router();

  async function authenticate(req, res, isRegistration) {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    const passwordBytes = Buffer.byteLength(password, 'utf8');
    if (passwordBytes < 8 || passwordBytes > 72) {
      return res.status(400).json({ error: 'Password must be between 8 and 72 UTF-8 bytes.' });
    }

    if (isRegistration) {
      const existingUser = await userStore.findByEmail(email);
      if (existingUser) return res.status(409).json({ error: 'An account with this email already exists.' });

      const user = {
        id: randomUUID(),
        email,
        passwordHash: await bcrypt.hash(password, 12),
        createdAt: new Date().toISOString(),
      };
      try {
        await userStore.create(user);
      } catch (error) {
        if (isDuplicateEmailError(error)) {
          return res.status(409).json({ error: 'An account with this email already exists.' });
        }
        throw error;
      }

      return sendToken(res, user, jwtSecret, 201);
    }

    const user = await userStore.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    return sendToken(res, user, jwtSecret, 200);
  }

  router.post('/register', (req, res, next) => {
    authenticate(req, res, true).catch(next);
  });
  router.post('/login', (req, res, next) => {
    authenticate(req, res, false).catch(next);
  });

  return router;
}

function sendToken(res, user, secret, status) {
  const token = jwt.sign({ email: user.email }, secret, {
    algorithm: 'HS256',
    subject: user.id,
    issuer: 'todo-app',
    expiresIn: TOKEN_LIFETIME,
  });
  return res.status(status).json({ token, tokenType: 'Bearer', expiresIn: 3600, user: { id: user.id, email: user.email } });
}

module.exports = { createAuthRouter };
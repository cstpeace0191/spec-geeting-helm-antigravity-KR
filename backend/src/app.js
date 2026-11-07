const express = require('express');
const { createAuthRouter } = require('./routes/auth');

function createApp({ userStore, jwtSecret }) {
  if (!userStore) throw new Error('A user store is required.');
  if (typeof jwtSecret !== 'string' || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes.');
  }

  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use('/api/auth', createAuthRouter({ userStore, jwtSecret }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  });
  return app;
}

module.exports = { createApp };
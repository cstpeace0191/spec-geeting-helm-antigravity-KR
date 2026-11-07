const { randomUUID } = require('node:crypto');
const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createSqliteUserStore } = require('../../src/persistence/users');

const jwtSecret = 'test-secret-that-is-at-least-thirty-two-bytes';
let userStore;
let app;

before(async () => {
  userStore = await createSqliteUserStore(':memory:');
  app = createApp({ userStore, jwtSecret });
});

after(async () => {
  await userStore.close();
});

describe('authentication API', () => {
  it('creates an account, stores a password hash, and issues a JWT', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: '  Test@Example.com ', password: 'a-secure-password' });

    assert.equal(response.status, 201);
    assert.equal(response.body.user.email, 'test@example.com');
    assert.equal(response.body.tokenType, 'Bearer');
    const claims = jwt.verify(response.body.token, jwtSecret, { issuer: 'todo-app' });
    assert.equal(claims.sub, response.body.user.id);
    const storedUser = await userStore.findByEmail('test@example.com');
    assert.notEqual(storedUser.password_hash, 'a-secure-password');
  });

  it('authenticates an existing user and rejects an incorrect password', async () => {
    const success = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'a-secure-password' });
    const failure = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    assert.equal(success.status, 200);
    assert.equal(jwt.verify(success.body.token, jwtSecret).email, 'test@example.com');
    assert.equal(failure.status, 401);
    assert.deepEqual(failure.body, { error: 'Invalid email or password.' });
  });

  it('rejects duplicate accounts and invalid registration input', async () => {
    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ email: 'TEST@example.com', password: 'a-secure-password' });
    const invalid = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    assert.equal(duplicate.status, 409);
    assert.equal(invalid.status, 400);
  });

  it('requires a strong JWT secret before creating the app', () => {
    assert.throws(() => createApp({ userStore, jwtSecret: 'short' }), /JWT_SECRET/);
  });
});
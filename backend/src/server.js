const { createApp } = require('./app');
const { createUserStore } = require('./persistence/users');

async function start() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('Set JWT_SECRET to a secret value of at least 32 bytes.');
  }

  const userStore = await createUserStore();
  const app = createApp({ userStore, jwtSecret });
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () => console.log(`Todo API listening on port ${port}`));

  const shutdown = () => {
    server.close(async () => {
      await userStore.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
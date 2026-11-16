import { app } from './app.js';
import { env } from './config/env.js';
import { initDatabase } from './config/db.js';

async function bootstrap() {
  await initDatabase();
  app.listen(env.port, () => {
    console.log(`Registration API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});

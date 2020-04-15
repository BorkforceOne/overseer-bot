import { initConfig } from './general';

export const config = initConfig({
  discordApiKey: process.env.API_KEY,
  firebaseSecretsPath: process.env.FIREBASE_SECRETS_PATH,
});
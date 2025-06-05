import { initConfig } from './general';

// Define a function to get the config
function getConfig() {
  try {
    return initConfig({
      discordApiKey: process.env.API_KEY,
      firebaseSecretsPath: process.env.FIREBASE_SECRETS_PATH,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
  } catch (error) {
    console.warn('Warning: Some configuration variables could not be loaded. Using fallback values.');
    
    // Provide fallback values for testing
    return {
      discordApiKey: process.env.API_KEY || '',
      firebaseSecretsPath: process.env.FIREBASE_SECRETS_PATH || '',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    };
  }
}

// Export the config
export const config = getConfig();

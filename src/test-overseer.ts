import * as path from 'path';
import * as readline from 'readline';
import { DeepSeekService } from './services/app/deepseek_service';
import { OVERSEER_PROMPT } from './utils/prompts';

// Load environment variables from local.env
require('dotenv').config({ path: path.resolve(__dirname, '../envs/local/local.env') });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin as any,
  output: process.stdout as any
});

// Create an instance of the DeepSeekService
const deepseekService = new DeepSeekService();

/**
 * Function to test the Overseer hook with a user prompt
 * @param userPrompt The prompt to send to Overseer
 */
async function testOverseerPrompt(userPrompt: string): Promise<void> {
  try {
    console.log('\nSending prompt to Overseer...');
    
    // Combine the OVERSEER_PROMPT with the user's prompt
    const fullPrompt = `${OVERSEER_PROMPT}\n\n${userPrompt}`;
    
    // Get completion from DeepSeek using the OVERSEER_PROMPT
    const response = await deepseekService.getCompletion(fullPrompt, {
      maxTokens: 1000,
      temperature: 0.7
    });
    
    console.log('\n--- Overseer Response ---\n');
    console.log(response);
    console.log('\n------------------------\n');
  } catch (error) {
    console.error('Error testing Overseer prompt:', error);
  }
}

/**
 * Main function to run the test script
 */
async function main(): Promise<void> {
  console.log('=== Overseer Hook Test Script ===');
  console.log('This script allows you to test prompts against the !overseer hook');
  console.log('Type "exit" to quit the script\n');
  
  // Recursive function to keep asking for prompts
  const askForPrompt = () => {
    rl.question('Enter your prompt for Overseer: ', async (prompt) => {
      if (prompt.toLowerCase() === 'exit') {
        console.log('Exiting test script...');
        rl.close();
        return;
      }
      
      await testOverseerPrompt(prompt);
      askForPrompt(); // Ask for another prompt
    });
  };
  
  // Start asking for prompts
  askForPrompt();
}

// Run the main function
main().catch(error => {
  console.error('Error running test script:', error);
  process.exit(1);
});

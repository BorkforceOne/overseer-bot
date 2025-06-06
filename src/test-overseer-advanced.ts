import * as path from 'path';
import * as readline from 'readline';
import { AnthropicService } from './services/app/anthropic_service';
import { OVERSEER_PROMPT } from './utils/prompts';

// Load environment variables from local.env
require('dotenv').config({ path: path.resolve(__dirname, '../envs/local/local.env') });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin as any,
  output: process.stdout as any
});

// Create an instance of the AnthropicService
const anthropicService = new AnthropicService();

// Default configuration
const defaultConfig = {
  maxTokens: 1000,
  temperature: 0.7
};

// Current configuration (can be modified during runtime)
let currentConfig = { ...defaultConfig };

/**
 * Function to test the Overseer hook with a user prompt
 * @param userPrompt The prompt to send to Overseer
 * @param config Configuration options for the API call
 */
async function testOverseerPrompt(
  userPrompt: string, 
  config: { maxTokens: number; temperature: number }
): Promise<void> {
  try {
    console.log('\nSending prompt to Overseer...');
    console.log(`Configuration: maxTokens=${config.maxTokens}, temperature=${config.temperature}`);
    
    // Combine the OVERSEER_PROMPT with the user's prompt
    const fullPrompt = `${OVERSEER_PROMPT}\n\n${userPrompt}`;
    
    // Get completion from Claude using the OVERSEER_PROMPT
    const response = await anthropicService.getCompletion(fullPrompt, {
      maxTokens: config.maxTokens,
      temperature: config.temperature
    });
    
    console.log('\n--- Overseer Response ---\n');
    console.log(response);
    console.log('\n------------------------\n');
  } catch (error) {
    console.error('Error testing Overseer prompt:', error);
  }
}

/**
 * Process special commands
 * @param input User input
 * @returns true if a special command was processed, false otherwise
 */
function processSpecialCommands(input: string): boolean {
  // Check for exit command
  if (input.toLowerCase() === 'exit') {
    console.log('Exiting test script...');
    rl.close();
    return true;
  }
  
  // Check for help command
  if (input.toLowerCase() === 'help') {
    displayHelp();
    return true;
  }
  
  // Check for config command
  if (input.toLowerCase() === 'config') {
    console.log('\nCurrent Configuration:');
    console.log(`- maxTokens: ${currentConfig.maxTokens}`);
    console.log(`- temperature: ${currentConfig.temperature}`);
    return true;
  }
  
  // Check for reset command
  if (input.toLowerCase() === 'reset') {
    currentConfig = { ...defaultConfig };
    console.log('\nConfiguration reset to defaults.');
    console.log(`- maxTokens: ${currentConfig.maxTokens}`);
    console.log(`- temperature: ${currentConfig.temperature}`);
    return true;
  }
  
  // Check for set commands
  if (input.toLowerCase().startsWith('set ')) {
    const parts = input.split(' ');
    if (parts.length === 3) {
      const [_, param, value] = parts;
      
      if (param === 'maxTokens') {
        const tokens = parseInt(value, 10);
        if (!isNaN(tokens) && tokens > 0) {
          currentConfig.maxTokens = tokens;
          console.log(`maxTokens set to ${tokens}`);
          return true;
        }
      } else if (param === 'temperature') {
        const temp = parseFloat(value);
        if (!isNaN(temp) && temp >= 0 && temp <= 1) {
          currentConfig.temperature = temp;
          console.log(`temperature set to ${temp}`);
          return true;
        }
      }
    }
    
    console.log('Invalid set command. Use "set [maxTokens|temperature] [value]"');
    return true;
  }
  
  return false;
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log('\n--- Available Commands ---');
  console.log('help - Display this help message');
  console.log('exit - Exit the test script');
  console.log('config - Show current configuration');
  console.log('reset - Reset configuration to defaults');
  console.log('set maxTokens [number] - Set the maximum number of tokens (e.g., "set maxTokens 2000")');
  console.log('set temperature [0-1] - Set the temperature (e.g., "set temperature 0.9")');
  console.log('Any other input will be sent as a prompt to Overseer');
  console.log('------------------------\n');
}

/**
 * Main function to run the test script
 */
async function main(): Promise<void> {
  console.log('=== Overseer Hook Advanced Test Script ===');
  console.log('This script allows you to test prompts against the !overseer hook with configurable options');
  console.log('Type "help" for available commands or "exit" to quit the script\n');
  
  // Recursive function to keep asking for prompts
  const askForPrompt = () => {
    rl.question('Enter your prompt for Overseer (or command): ', async (input) => {
      // Process special commands
      if (processSpecialCommands(input)) {
        askForPrompt(); // Ask for another prompt
        return;
      }
      
      // Process as a regular prompt
      await testOverseerPrompt(input, currentConfig);
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

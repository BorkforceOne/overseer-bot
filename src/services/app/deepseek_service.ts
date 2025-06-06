import { config } from '../../utils/config';
import axios from 'axios';

// Define types for DeepSeek API requests and responses
interface DeepSeekMessageContent {
  type: 'text';
  text: string;
}

interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | DeepSeekMessageContent[];
}

interface DeepSeekChatCompletionRequest {
  model: string;
  messages: DeepSeekMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

interface DeepSeekChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://api.deepseek.com/v1/chat/completions';
  private readonly defaultModel: string = 'deepseek-chat';

  constructor() {
    this.apiKey = config.deepseekApiKey;
    if (!this.apiKey) {
      console.warn('DeepSeek API key is not configured. Some functionality may not work.');
    }
  }

  /**
   * Invokes a chat completion with DeepSeek
   * @param messages Array of messages in the conversation
   * @param options Additional options for the completion
   * @returns The completion response
   */
  async createChatCompletion(
    messages: DeepSeekMessage[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      stream?: boolean;
    } = {}
  ): Promise<DeepSeekChatCompletionResponse> {
    // Check if API key is available
    if (!this.apiKey) {
      throw new Error('DeepSeek API key is not configured. Cannot make API requests.');
    }
    
    const model = options.model || this.defaultModel;
    
    const requestBody: DeepSeekChatCompletionRequest = {
      model,
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature,
      top_p: options.topP,
      stream: options.stream || false,
    };

    try {
      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data as DeepSeekChatCompletionResponse;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error calling DeepSeek API:', error.response.status, error.response.statusText);
        throw new Error(`DeepSeek API error: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`);
      } else {
        console.error('Error calling DeepSeek API:', error);
        throw error;
      }
    }
  }

  /**
   * Simplified method to get a completion from DeepSeek with just a prompt
   * @param prompt The user prompt
   * @param options Additional options for the completion
   * @returns The text of the completion
   */
  async getCompletion(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    const messages: DeepSeekMessage[] = [
      { role: 'user', content: prompt }
    ];

    const response = await this.createChatCompletion(messages, options);
    
    // Extract the text content from the response
    return response.choices[0].message.content;
  }
}

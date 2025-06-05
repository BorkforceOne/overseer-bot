import { config } from '../../utils/config';

// Define types for Anthropic API requests and responses
interface AnthropicMessageContent {
  type: 'text';
  text: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicMessageContent[];
}

interface AnthropicChatCompletionRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
}

interface AnthropicChatCompletionResponse {
  id: string;
  type: string;
  role: string;
  content: { type: string; text: string }[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://api.anthropic.com/v1/messages';
  private readonly defaultModel: string = 'claude-3-7-sonnet-20250219';

  constructor() {
    this.apiKey = config.anthropicApiKey;
    if (!this.apiKey) {
      console.warn('Anthropic API key is not configured. Some functionality may not work.');
    }
  }

  /**
   * Invokes a chat completion with Claude Sonnet 3.7
   * @param messages Array of messages in the conversation
   * @param options Additional options for the completion
   * @returns The completion response
   */
  async createChatCompletion(
    messages: AnthropicMessage[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      stopSequences?: string[];
      stream?: boolean;
    } = {}
  ): Promise<AnthropicChatCompletionResponse> {
    // Check if API key is available
    if (!this.apiKey) {
      throw new Error('Anthropic API key is not configured. Cannot make API requests.');
    }
    
    const model = options.model || this.defaultModel;
    
    const requestBody: AnthropicChatCompletionRequest = {
      model,
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature,
      top_p: options.topP,
      top_k: options.topK,
      stop_sequences: options.stopSequences,
      stream: options.stream || false,
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      return await response.json() as AnthropicChatCompletionResponse;
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw error;
    }
  }

  /**
   * Simplified method to get a completion from Claude with just a prompt
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
      topK?: number;
      stopSequences?: string[];
    } = {}
  ): Promise<string> {
    const messages: AnthropicMessage[] = [
      { role: 'user', content: prompt }
    ];

    const response = await this.createChatCompletion(messages, options);
    
    // Extract the text content from the response
    return response.content.map(item => item.text).join('');
  }
}

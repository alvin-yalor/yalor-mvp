import { openai } from '@ai-sdk/openai';

/**
 * Centralized LLM Provider Configuration.
 * 
 * By defining the model here, we establish a single point of configuration
 * for the AI SDK. If we ever want to switch from OpenAI to Anthropic,
 * we simply change `openai('gpt-4o-mini')` to `anthropic('claude-3-5-haiku-latest')`.
 */
export const chatModel = openai('gpt-4o-mini');

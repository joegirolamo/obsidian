import { prisma } from '@/lib/prisma';

/**
 * AI Service
 * Provides a model-agnostic interface to interact with AI services
 * Uses the configured AI provider from the database
 */

interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * Get the active AI configuration from the database
 */
async function getActiveAIConfig() {
  const aiConfig = await prisma.aIConfiguration.findFirst({
    where: { isActive: true },
  });

  if (!aiConfig) {
    throw new Error('No active AI configuration found. Please configure an AI provider in settings.');
  }

  return aiConfig;
}

/**
 * Call the OpenAI API with the given prompt
 */
async function callOpenAI(prompt: string, options: AIOptions = {}) {
  const aiConfig = await getActiveAIConfig();
  
  if (aiConfig.provider !== 'openai') {
    throw new Error('AI configuration is not for OpenAI');
  }

  try {
    // Dynamic import to avoid requiring the package unless needed
    const { OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: aiConfig.apiKey,
    });

    const response = await openai.chat.completions.create({
      model: options.model || aiConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that specializes in extracting and structuring information from marketing and business reports. Return your response as properly formatted JSON only, without any other text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2000,
      response_format: { type: 'json_object' }
    });

    return response.choices[0]?.message?.content || '{}';
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error(`Failed to process with OpenAI: ${error.message}`);
  }
}

/**
 * Call the Anthropic API with the given prompt
 */
async function callAnthropic(prompt: string, options: AIOptions = {}) {
  const aiConfig = await getActiveAIConfig();
  
  if (aiConfig.provider !== 'anthropic') {
    throw new Error('AI configuration is not for Anthropic');
  }

  try {
    // Dynamic import to avoid requiring the package unless needed
    const { Anthropic } = await import('@anthropic-ai/sdk');
    
    const anthropic = new Anthropic({
      apiKey: aiConfig.apiKey,
    });

    const response = await anthropic.messages.create({
      model: options.model || aiConfig.model,
      system: 'You are a helpful assistant that specializes in extracting and structuring information from marketing and business reports. Return your response as properly formatted JSON only, without any other text.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2000,
    });

    // Parse the response to extract JSON
    const content = response.content[0]?.text || '{}';
    
    // Try to extract JSON from the response if it's not already pure JSON
    try {
      if (content.startsWith('{') && content.endsWith('}')) {
        return content;
      } else {
        // Extract JSON from text
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                          content.match(/{[\s\S]*}/) ||
                          content.match(/```\n([\s\S]*?)\n```/);
        
        if (jsonMatch) {
          return jsonMatch[1] || '{}';
        }
        return '{}';
      }
    } catch (e) {
      console.warn('Failed to extract JSON from Anthropic response:', e);
      return content;
    }
  } catch (error) {
    console.error('Error calling Anthropic:', error);
    throw new Error(`Failed to process with Anthropic: ${error.message}`);
  }
}

/**
 * Process a PDF file with AI
 * @param pdfText The text extracted from the PDF file
 * @param prompt The prompt to send to the AI
 * @param options Additional options for the AI call
 * @returns The structured response from the AI
 */
export async function processWithAI(prompt: string, options: AIOptions = {}) {
  const aiConfig = await getActiveAIConfig();
  
  switch (aiConfig.provider.toLowerCase()) {
    case 'openai':
      return await callOpenAI(prompt, options);
    case 'anthropic':
      return await callAnthropic(prompt, options);
    default:
      throw new Error(`Unsupported AI provider: ${aiConfig.provider}`);
  }
}

/**
 * Parse structured data from the AI response
 * @param response The raw response from the AI
 * @returns Parsed JSON object
 */
export function parseAIResponse(response: string) {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse AI response');
  }
} 
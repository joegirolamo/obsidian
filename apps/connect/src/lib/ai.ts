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
  try {
    // Type cast to ensure correct model casing access
    const prismaAny = prisma as any;
    
    // First try with standard casing (AIConfiguration)
    let aiConfig;
    try {
      aiConfig = await prismaAny.AIConfiguration.findFirst({
        where: { isActive: true },
      });
    } catch (error) {
      console.log('[INFO] Failed with AIConfiguration, trying aIConfiguration');
      // If that fails, try with Prisma's auto-generated casing (aIConfiguration)
      aiConfig = await prismaAny.aIConfiguration.findFirst({
        where: { isActive: true },
      });
    }

    if (aiConfig) {
      console.log('[INFO] Found active AI configuration:', aiConfig.provider, aiConfig.model);
      return aiConfig;
    }

    // If no config exists, try to create a default one using environment variables
    console.log('[INFO] No active AI configuration found, attempting to create default');
    
    // Check for environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4.1';
    
    if (apiKey) {
      try {
        // Try to create with standard casing first
        try {
          aiConfig = await prismaAny.AIConfiguration.create({
            data: {
              provider: 'OpenAI',
              apiKey: apiKey,
              model: model,
              isActive: true,
              options: {}
            }
          });
        } catch (error) {
          // If that fails, try with Prisma's auto-generated casing
          aiConfig = await prismaAny.aIConfiguration.create({
            data: {
              provider: 'OpenAI',
              apiKey: apiKey,
              model: model,
              isActive: true,
              options: {}
            }
          });
        }
        
        console.log('[INFO] Created default AI configuration from environment variables');
        return aiConfig;
      } catch (error) {
        console.error('[ERROR] Failed to create default AI configuration:', error);
      }
    }
    
    throw new Error('No active AI configuration found. Please configure an AI provider in settings.');
  } catch (error) {
    console.error('[ERROR] Failed to get AI configuration:', error);
    throw error;
  }
}

/**
 * Call the OpenAI API with the given prompt
 */
async function callOpenAI(prompt: string, options: AIOptions = {}) {
  try {
    const aiConfig = await getActiveAIConfig();
    
    // Check provider name case-insensitively
    if (aiConfig.provider.toLowerCase() !== 'openai') {
      console.warn(`AI configuration is for ${aiConfig.provider}, not OpenAI, using fallback data generation`);
      // Return an empty response object that can be parsed as JSON
      return '{}';
    }

    // Dynamic import to avoid requiring the package unless needed
    const { OpenAI } = await import('openai');
    
    console.log('[INFO] Calling OpenAI API with model:', options.model || aiConfig.model);
    
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

    console.log('[INFO] OpenAI response received, length:', response.choices[0]?.message?.content?.length || 0);
    
    return response.choices[0]?.message?.content || '{}';
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    // Return an empty response object that can be parsed as JSON
    return '{}';
  }
}

/**
 * Call the Anthropic API with the given prompt
 */
async function callAnthropic(prompt: string, options: AIOptions = {}) {
  try {
    const aiConfig = await getActiveAIConfig();
    
    // Check provider name case-insensitively
    if (aiConfig.provider.toLowerCase() !== 'anthropic') {
      console.warn(`AI configuration is for ${aiConfig.provider}, not Anthropic, using fallback data generation`);
      // Return an empty response object that can be parsed as JSON
      return '{}';
    }

    // Dynamic import to avoid requiring the package unless needed
    const { Anthropic } = await import('@anthropic-ai/sdk');
    
    console.log('[INFO] Calling Anthropic API with model:', options.model || aiConfig.model);
    
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
    // Check response.content[0] type to avoid TS errors
    let content = '{}';
    if (response.content && response.content.length > 0) {
      const firstContent = response.content[0];
      if (typeof firstContent === 'object' && 'text' in firstContent) {
        content = firstContent.text;
      }
    }
    
    console.log('[INFO] Anthropic response received, length:', content.length);
    
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
  } catch (error: any) {
    console.error('Error calling Anthropic:', error);
    // Return an empty response object that can be parsed as JSON
    return '{}';
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
  const providerLower = aiConfig.provider.toLowerCase();
  
  // Log a small sample of the prompt for debugging
  console.log('[INFO] Processing AI prompt, first 100 chars:', prompt.substring(0, 100));
  
  switch (providerLower) {
    case 'openai':
      return await callOpenAI(prompt, options);
    case 'anthropic':
      return await callAnthropic(prompt, options);
    default:
      console.error(`[ERROR] Unsupported AI provider: ${aiConfig.provider}`);
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
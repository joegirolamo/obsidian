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
    
    // Log prompt size for debugging
    console.log(`[INFO] Calling OpenAI API with model: ${options.model || aiConfig.model}, prompt length: ${prompt.length} chars`);
    
    const openai = new OpenAI({
      apiKey: aiConfig.apiKey,
    });

    // Use a higher token limit for more comprehensive responses
    // Default to 4000 max_tokens for better completions
    const maxTokens = options.maxTokens ?? 4000;
    
    console.log(`[INFO] OpenAI request with max_tokens: ${maxTokens}, temperature: ${options.temperature ?? 0.3}`);
    
    const response = await openai.chat.completions.create({
      model: options.model || aiConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that specializes in extracting and structuring information from marketing and business reports. Your analysis should be detailed, data-driven, and provide specific actionable insights. Return your response as properly formatted JSON only, without any other text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    });

    console.log('[INFO] OpenAI response received, length:', response.choices[0]?.message?.content?.length || 0);
    
    // Check if we got a substantive response
    const content = response.choices[0]?.message?.content || '{}';
    if (content.length < 50) {
      console.warn('[WARN] OpenAI returned very short response:', content);
    }
    
    return content;
  } catch (error: any) {
    console.error('[ERROR] Error calling OpenAI:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('[ERROR] OpenAI API error details:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    throw new Error(`OpenAI API error: ${error.message}`);
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
    
    // Log prompt size for debugging
    console.log(`[INFO] Calling Anthropic API with model: ${options.model || aiConfig.model}, prompt length: ${prompt.length} chars`);
    
    const anthropic = new Anthropic({
      apiKey: aiConfig.apiKey,
    });

    // Use a higher token limit for more comprehensive responses
    const maxTokens = options.maxTokens ?? 4000;
    
    console.log(`[INFO] Anthropic request with max_tokens: ${maxTokens}, temperature: ${options.temperature ?? 0.3}`);
    
    const response = await anthropic.messages.create({
      model: options.model || aiConfig.model,
      system: 'You are a helpful assistant that specializes in extracting and structuring information from marketing and business reports. Your analysis should be detailed, data-driven, and provide specific actionable insights. Return your response as properly formatted JSON only, without any other text.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: maxTokens,
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
    
    // Check if we got a substantive response
    if (content.length < 50) {
      console.warn('[WARN] Anthropic returned very short response:', content);
    }
    
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
        
        console.warn('[WARN] Failed to extract JSON from Anthropic response, returning raw content');
        return content;
      }
    } catch (e: unknown) {
      console.warn('[WARN] Failed to extract JSON from Anthropic response:', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to extract JSON from Anthropic response: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('[ERROR] Error calling Anthropic:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('[ERROR] Anthropic API error details:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    throw new Error(`Anthropic API error: ${error.message}`);
  }
}

/**
 * Process a prompt with AI
 * @param prompt The prompt to send to the AI
 * @param options Additional options for the AI call
 * @returns The structured response from the AI
 */
export async function processWithAI(prompt: string, options: AIOptions = {}) {
  try {
    const aiConfig = await getActiveAIConfig();
    const providerLower = aiConfig.provider.toLowerCase();
    
    // Log a small sample of the prompt for debugging
    console.log('[INFO] Processing AI prompt, length:', prompt.length);
    console.log('[INFO] Prompt sample (first 100 chars):', prompt.substring(0, 100));
    
    let response = '';
    switch (providerLower) {
      case 'openai':
        response = await callOpenAI(prompt, options);
        break;
      case 'anthropic':
        response = await callAnthropic(prompt, options);
        break;
      default:
        console.error(`[ERROR] Unsupported AI provider: ${aiConfig.provider}`);
        throw new Error(`Unsupported AI provider: ${aiConfig.provider}`);
    }
    
    // Check response validity
    if (!response || response === '{}' || response.length < 50) {
      console.warn('[WARN] AI returned empty or very short response');
    }
    
    return response;
  } catch (error) {
    console.error('[ERROR] processWithAI failed:', error);
    throw error;
  }
}

/**
 * Parse structured data from the AI response
 * @param response The raw response from the AI
 * @returns Parsed JSON object
 */
export function parseAIResponse(response: string) {
  try {
    // Strip any markdown code block markers
    let cleanedResponse = response;
    if (response.includes('```json')) {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        cleanedResponse = jsonMatch[1];
      }
    } else if (response.includes('```')) {
      const jsonMatch = response.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        cleanedResponse = jsonMatch[1];
      }
    }
    
    // Trim whitespace
    cleanedResponse = cleanedResponse.trim();
    
    // Ensure it starts with { and ends with }
    if (!cleanedResponse.startsWith('{') || !cleanedResponse.endsWith('}')) {
      console.warn('[WARN] Response is not a valid JSON object, attempting to extract JSON');
      
      // Try to extract a JSON object from the text
      const jsonMatch = cleanedResponse.match(/{[\s\S]*}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      } else {
        throw new Error('Could not extract valid JSON from AI response');
      }
    }
    
    // Parse the JSON
    const parsedResponse = JSON.parse(cleanedResponse);
    console.log('[INFO] Successfully parsed AI response into JSON object with keys:', Object.keys(parsedResponse));
    return parsedResponse;
  } catch (error) {
    console.error('[ERROR] Error parsing AI response:', error);
    console.error('[ERROR] Raw response sample (first 500 chars):', response.substring(0, 500));
    throw new Error('Failed to parse AI response into valid JSON');
  }
} 
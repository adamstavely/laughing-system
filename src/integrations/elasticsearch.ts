/**
 * Elasticsearch Integration
 */

import type { ElasticConfig, FeedbackData } from '../types';

/**
 * Transform feedback data to Elasticsearch document format
 */
function transformToElasticsearchDocument(
  feedback: FeedbackData
): Record<string, any> {
  return {
    timestamp: feedback.timestamp,
    nps_score: feedback.npsScore,
    nps_segment: feedback.npsSegment,
    category: feedback.category,
    severity: feedback.severity,
    feedback_text: feedback.feedbackText,
    url: feedback.context.url,
    user_id: feedback.context.userId,
    session_id: feedback.context.sessionId,
    browser: feedback.context.userAgent,
    viewport: feedback.context.viewport,
    app_version: feedback.context.appVersion,
    annotations: feedback.annotations.map((annotation) => ({
      type: annotation.type,
      selector: annotation.selector,
      text_content: annotation.textContent,
      coordinates: annotation.coordinates,
      screenshot: annotation.screenshot,
      metadata: annotation.metadata,
      timestamp: annotation.timestamp,
    })),
    contact_preference: feedback.contactPreference,
    custom_context: feedback.context.customContext || {},
  };
}

/**
 * Create Elasticsearch index with mapping template if provided
 */
async function ensureElasticsearchIndex(
  config: ElasticConfig
): Promise<void> {
  if (!config.createIndexIfNotExists && !config.mappingTemplate) {
    return; // Skip index creation
  }

  const endpoint = `${config.endpoint}/${config.indexName}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (config.apiKey) {
    headers['Authorization'] = `ApiKey ${config.apiKey}`;
  }

  // Check if index exists
  const checkResponse = await fetch(endpoint, {
    method: 'HEAD',
    headers,
  });

  if (checkResponse.ok) {
    return; // Index already exists
  }

  // Create index with mapping if template provided
  const indexBody: Record<string, any> = {};

  if (config.mappingTemplate) {
    try {
      // Parse mapping template (can be JSON string or object)
      const mapping =
        typeof config.mappingTemplate === 'string'
          ? JSON.parse(config.mappingTemplate)
          : config.mappingTemplate;
      indexBody.mappings = mapping.mappings || mapping;
      indexBody.settings = mapping.settings || {};
    } catch (error) {
      console.warn('Failed to parse mapping template:', error);
    }
  } else {
    // Default mapping for feedback documents
    indexBody.mappings = {
      properties: {
        timestamp: { type: 'date' },
        nps_score: { type: 'integer' },
        nps_segment: { type: 'keyword' },
        category: { type: 'keyword' },
        severity: { type: 'keyword' },
        feedback_text: {
          type: 'text',
          fields: { keyword: { type: 'keyword', ignore_above: 256 } },
        },
        url: { type: 'keyword' },
        user_id: { type: 'keyword' },
        session_id: { type: 'keyword' },
        browser: { type: 'keyword' },
        viewport: { type: 'object' },
        app_version: { type: 'keyword' },
        annotations: { type: 'nested' },
        contact_preference: { type: 'boolean' },
        custom_context: { type: 'object', enabled: true },
      },
    };
  }

  const createResponse = await fetch(endpoint, {
    method: 'PUT',
    headers,
    body: JSON.stringify(indexBody),
  });

  if (!createResponse.ok && createResponse.status !== 400) {
    // 400 might mean index already exists, which is fine
    const errorText = await createResponse.text();
    console.warn(`Failed to create Elasticsearch index: ${errorText}`);
  }
}

/**
 * Index document in Elasticsearch
 */
async function indexElasticsearchDocument(
  feedback: FeedbackData,
  config: ElasticConfig
): Promise<{ id: string; index: string }> {
  // Ensure index exists if configured
  if (config.createIndexIfNotExists) {
    await ensureElasticsearchIndex(config);
  }

  const document = transformToElasticsearchDocument(feedback);
  
  const endpoint = `${config.endpoint}/${config.indexName}/_doc`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  if (config.apiKey) {
    headers['Authorization'] = `ApiKey ${config.apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Elasticsearch API error (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();
  
  return {
    id: result._id,
    index: result._index,
  };
}

/**
 * Retry logic with exponential backoff
 */
export async function indexElasticsearchDocumentWithRetry(
  feedback: FeedbackData,
  config: ElasticConfig,
  maxRetries: number = 3
): Promise<{ id: string; index: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await indexElasticsearchDocument(feedback, config);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to index Elasticsearch document after retries');
}

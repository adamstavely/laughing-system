/**
 * Authentication utilities for integrations
 */

import type { JiraConfig, JiraAuthMethod } from '../types';

/**
 * Get authentication headers for Jira
 */
export async function getJiraAuthHeaders(
  config: JiraConfig
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const authMethod: JiraAuthMethod = config.authMethod || 'token';

  switch (authMethod) {
    case 'basic':
      if (config.authToken) {
        // Format: email:password or email:apiToken
        const auth = btoa(config.authToken);
        headers['Authorization'] = `Basic ${auth}`;
      }
      break;

    case 'token':
      if (config.authToken) {
        // API token format: email:token
        const auth = btoa(config.authToken);
        headers['Authorization'] = `Basic ${auth}`;
      }
      break;

    case 'oauth2':
      if (config.oauth2?.accessToken) {
        headers['Authorization'] = `Bearer ${config.oauth2.accessToken}`;
      } else if (config.oauth2?.clientId && config.oauth2?.clientSecret) {
        // Try to get token (simplified - in production, handle token refresh)
        const token = await getOAuth2Token(config.oauth2);
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      break;

    case 'custom':
      // Custom headers should be provided via config.headers
      break;
  }

  return headers;
}

/**
 * Get OAuth 2.0 access token (simplified implementation)
 */
async function getOAuth2Token(
  oauth2: NonNullable<JiraConfig['oauth2']>
): Promise<string | null> {
  // If access token is provided, use it
  if (oauth2.accessToken) {
    return oauth2.accessToken;
  }

  // If we have client credentials, try to get token
  if (oauth2.clientId && oauth2.clientSecret && oauth2.tokenUrl) {
    try {
      const response = await fetch(oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: oauth2.clientId,
          client_secret: oauth2.clientSecret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
    } catch (error) {
      console.error('Failed to get OAuth2 token:', error);
    }
  }

  return null;
}

/**
 * Validate Jira configuration
 */
export function validateJiraConfig(config: JiraConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.projectKey) {
    errors.push('Jira projectKey is required');
  }

  if (!config.apiEndpoint) {
    errors.push('Jira apiEndpoint is required');
  }

  const authMethod: JiraAuthMethod = config.authMethod || 'token';

  switch (authMethod) {
    case 'basic':
    case 'token':
      if (!config.authToken) {
        errors.push(`Jira authToken is required for ${authMethod} authentication`);
      }
      break;

    case 'oauth2':
      if (!config.oauth2) {
        errors.push('Jira oauth2 config is required for OAuth2 authentication');
      } else if (!config.oauth2.accessToken && !config.oauth2.clientId) {
        errors.push('Jira OAuth2 requires either accessToken or clientId/clientSecret');
      }
      break;

    case 'custom':
      if (!config.headers || !config.headers['Authorization']) {
        errors.push('Jira custom auth requires Authorization header in headers config');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Elasticsearch configuration
 */
export function validateElasticsearchConfig(config: {
  indexName: string;
  endpoint: string;
  apiKey?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.indexName) {
    errors.push('Elasticsearch indexName is required');
  }

  if (!config.endpoint) {
    errors.push('Elasticsearch endpoint is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

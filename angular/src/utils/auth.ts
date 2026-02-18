/**
 * Authentication utilities (kept for optional/reference use)
 * Ported from React src/utils/auth.ts
 */

export interface AuthConfig {
  authMethod?: 'basic' | 'token' | 'oauth2' | 'custom';
  authToken?: string;
  oauth2?: {
    clientId: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenUrl?: string;
  };
  headers?: Record<string, string>;
}

export async function getAuthHeaders(config: AuthConfig): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const authMethod = config.authMethod || 'token';

  switch (authMethod) {
    case 'basic':
    case 'token':
      if (config.authToken) {
        const auth = btoa(config.authToken);
        headers['Authorization'] = `Basic ${auth}`;
      }
      break;

    case 'oauth2':
      if (config.oauth2?.accessToken) {
        headers['Authorization'] = `Bearer ${config.oauth2.accessToken}`;
      } else if (config.oauth2?.clientId && config.oauth2?.clientSecret && config.oauth2?.tokenUrl) {
        try {
          const response = await fetch(config.oauth2.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: config.oauth2.clientId,
              client_secret: config.oauth2.clientSecret,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            headers['Authorization'] = `Bearer ${data.access_token}`;
          }
        } catch (error) {
          console.error('Failed to get OAuth2 token:', error);
        }
      }
      break;

    case 'custom':
      break;
  }

  return headers;
}

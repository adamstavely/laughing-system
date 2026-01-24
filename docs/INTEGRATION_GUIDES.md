# Integration Guides

Step-by-step guides for integrating the feedback component with Jira and Elasticsearch.

## Jira Integration

### Prerequisites

- Jira Cloud or Jira Server instance
- API access token or OAuth credentials
- Project key where issues will be created

### Setup Steps

#### 1. Create API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Copy the token (you'll need it in format: `email@example.com:token`)

#### 2. Configure Component

```tsx
import { FeedbackComponent } from 'contextual-feedback-component';

<FeedbackComponent
  jiraConfig={{
    projectKey: 'PROJ',
    apiEndpoint: 'https://your-domain.atlassian.net',
    authMethod: 'token',
    authToken: 'email@example.com:your-api-token',
    issueType: 'Task', // Optional, default: 'Task'
  }}
/>
```

### Authentication Methods

#### Token Authentication (Recommended)

```tsx
jiraConfig={{
  authMethod: 'token',
  authToken: 'email@example.com:api-token',
}}
```

#### Basic Authentication

```tsx
jiraConfig={{
  authMethod: 'basic',
  authToken: 'email@example.com:password',
}}
```

#### OAuth 2.0

```tsx
jiraConfig={{
  authMethod: 'oauth2',
  oauth2: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    accessToken: 'your-access-token', // Or provide tokenUrl for auto-fetch
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
  },
}}
```

#### Custom Headers

```tsx
jiraConfig={{
  authMethod: 'custom',
  headers: {
    'Authorization': 'Bearer your-token',
  },
}}
```

### Custom Fields

Map feedback data to Jira custom fields:

```tsx
jiraConfig={{
  projectKey: 'PROJ',
  apiEndpoint: 'https://your-domain.atlassian.net',
  authToken: 'email@example.com:token',
  customFields: {
    'customfield_10001': 'Custom Value',
    'customfield_10002': feedback.npsScore,
  },
}}
```

### Issue Format

Issues are created with:
- **Summary**: `[User Feedback] {Category} - {URL path}`
- **Description**: Formatted markdown with feedback, metadata, and annotations
- **Labels**: `user-feedback`, NPS segment, category
- **Attachments**: Screenshots of annotations

## Elasticsearch Integration

### Prerequisites

- Elasticsearch cluster (7.x or 8.x)
- API key or basic auth credentials
- Index name for feedback documents

### Setup Steps

#### 1. Create API Key (Optional)

If using API key authentication:

```bash
curl -X POST "https://your-elasticsearch.com/_security/api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "feedback-component-key",
    "role_descriptors": {
      "feedback_writer": {
        "cluster": ["all"],
        "index": [{
          "names": ["feedback-*"],
          "privileges": ["write", "create_index"]
        }]
      }
    }
  }'
```

#### 2. Configure Component

```tsx
<FeedbackComponent
  elasticConfig={{
    indexName: 'user-feedback',
    endpoint: 'https://your-elasticsearch.com',
    apiKey: 'your-api-key',
    createIndexIfNotExists: true, // Auto-create index with default mapping
  }}
/>
```

### Custom Index Mapping

Provide a custom mapping template:

```tsx
elasticConfig={{
  indexName: 'user-feedback',
  endpoint: 'https://your-elasticsearch.com',
  apiKey: 'your-api-key',
  mappingTemplate: {
    mappings: {
      properties: {
        timestamp: { type: 'date' },
        nps_score: { type: 'integer' },
        feedback_text: {
          type: 'text',
          analyzer: 'standard',
        },
        // ... custom fields
      },
    },
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
    },
  },
}}
```

Or as JSON string:

```tsx
mappingTemplate: JSON.stringify({
  mappings: { /* ... */ },
  settings: { /* ... */ },
})
```

### Document Schema

Documents are indexed with the following structure:

```json
{
  "timestamp": "2026-01-24T10:30:00Z",
  "nps_score": 8,
  "nps_segment": "promoter",
  "category": "feature",
  "feedback_text": "Great feature!",
  "url": "/dashboard",
  "user_id": "user_123",
  "session_id": "sess_456",
  "browser": "Chrome 121",
  "viewport": { "width": 1920, "height": 1080 },
  "annotations": [
    {
      "type": "element",
      "selector": ".button",
      "screenshot": "base64...",
      "coordinates": { "x": 100, "y": 200, "width": 50, "height": 30 }
    }
  ],
  "custom_context": {}
}
```

### Querying Feedback

Example Elasticsearch queries:

```json
// Get all feedback
GET /user-feedback/_search

// Get detractors
GET /user-feedback/_search
{
  "query": {
    "term": { "nps_segment": "detractor" }
  }
}

// Get feedback by category
GET /user-feedback/_search
{
  "query": {
    "term": { "category": "bug" }
  }
}

// Aggregate NPS scores
GET /user-feedback/_search
{
  "aggs": {
    "nps_distribution": {
      "terms": { "field": "nps_segment" }
    }
  }
}
```

## CORS Configuration

### Jira

Ensure your Jira instance allows CORS from your domain:

1. Go to Jira Settings → System → HTTP Settings
2. Add your domain to allowed origins
3. Or use a proxy server

### Elasticsearch

Configure CORS in `elasticsearch.yml`:

```yaml
http.cors.enabled: true
http.cors.allow-origin: "https://your-domain.com"
http.cors.allow-headers: "Authorization,Content-Type"
```

Or use Elasticsearch Service API keys which handle CORS automatically.

## Error Handling

Both integrations include automatic retry logic with exponential backoff:

- Retries up to 3 times
- Exponential backoff: 1s, 2s, 4s
- No retry on 4xx errors (client errors)
- Errors are passed to `onError` callback

## Rate Limiting

### Jira

Jira Cloud has rate limits:
- 300 requests per minute per app
- Use retry logic for 429 responses

### Elasticsearch

Elasticsearch rate limits depend on your cluster configuration. Monitor for 429 responses and implement backoff.

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Use API keys** - Prefer API keys over passwords
3. **Restrict permissions** - Use least-privilege access
4. **Enable HTTPS** - Always use encrypted connections
5. **Validate input** - Component validates all inputs
6. **Sanitize data** - Custom context is validated

## Troubleshooting

### Jira Issues

**401 Unauthorized**
- Check auth token format: `email:token`
- Verify token is valid
- Check API permissions

**403 Forbidden**
- Verify project key exists
- Check user has create issue permission
- Verify issue type is valid

**404 Not Found**
- Check API endpoint URL
- Verify project key

### Elasticsearch Issues

**401 Unauthorized**
- Verify API key is correct
- Check API key has write permissions

**404 Not Found**
- Enable `createIndexIfNotExists: true`
- Or create index manually

**400 Bad Request**
- Check mapping template format
- Verify field types match data

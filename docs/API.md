# API Reference

Complete API documentation for the Contextual Feedback Component.

## FeedbackComponent

The main component for capturing user feedback with visual annotations.

### Props

#### Backend Integration

##### `jiraConfig?: JiraConfig`

Configuration for Jira integration.

```typescript
interface JiraConfig {
  projectKey: string;
  apiEndpoint: string;
  issueType?: string; // default: 'Task'
  customFields?: Record<string, any>;
  authMethod?: 'basic' | 'token' | 'oauth2' | 'custom'; // default: 'token'
  authToken?: string; // For 'token' or 'basic' method
  oauth2?: {
    clientId: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenUrl?: string;
  };
  headers?: Record<string, string>;
}
```

**Example:**
```tsx
<FeedbackComponent
  jiraConfig={{
    projectKey: 'PROJ',
    apiEndpoint: 'https://your-domain.atlassian.net',
    authMethod: 'token',
    authToken: 'email@example.com:api-token',
  }}
/>
```

##### `elasticConfig?: ElasticConfig`

Configuration for Elasticsearch integration.

```typescript
interface ElasticConfig {
  indexName: string;
  endpoint: string;
  apiKey?: string;
  mappingTemplate?: string | Record<string, any>;
  headers?: Record<string, string>;
  createIndexIfNotExists?: boolean; // default: false
}
```

**Example:**
```tsx
<FeedbackComponent
  elasticConfig={{
    indexName: 'user-feedback',
    endpoint: 'https://your-elasticsearch.com',
    apiKey: 'your-api-key',
    createIndexIfNotExists: true,
  }}
/>
```

#### Behavioral Configuration

##### `enableNPS?: boolean`
Enable/disable NPS rating collection. Default: `true`

##### `enableAnnotations?: boolean`
Enable/disable annotation tools. Default: `true`

##### `requireCategory?: boolean`
Require category selection. Default: `false`

##### `enableAnimationPause?: boolean`
Enable animation pause tool. Default: `true`

##### `enableTextSelection?: boolean`
Enable text selection annotation. Default: `true`

##### `enableAreaSelection?: boolean`
Enable area selection annotation. Default: `true`

#### UI Configuration

##### `position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`
Toolbar position. Default: `'bottom-right'`

##### `theme?: 'light' | 'dark' | 'auto'`
Theme mode. Default: `'auto'` (follows system preference)

##### `accentColor?: string`
Primary brand color (CSS color value). Overrides default blue.

##### `locale?: string`
Locale for internationalization (future feature).

#### Context

##### `appVersion?: string`
Application version to include in feedback metadata.

##### `customContext?: Record<string, any>`
Custom context data to include in feedback. Must be JSON serializable, max 10KB.

##### `getUserId?: () => string | null`
Function to get current user ID.

##### `getSessionId?: () => string`
Function to get session ID (defaults to auto-generated).

#### Callbacks

##### `onSubmit?: (feedback: FeedbackData) => void`
Called when feedback is successfully submitted.

##### `onError?: (error: Error) => void`
Called when an error occurs.

##### `onAnnotationCreate?: (annotation: Annotation) => void`
Called when a new annotation is created.

#### Advanced

##### `selectorPriority?: string[]`
Custom selector generation priority. Options: `'data-testid'`, `'id'`, `'unique-class'`, `'nth-child'`.

##### `screenshotQuality?: number`
Screenshot quality (0-1). Default: `0.8`

##### `maxAnnotations?: number`
Maximum number of annotations allowed. Default: `10`

##### `debounceMs?: number`
Auto-save debounce time in milliseconds. Default: `500`

### Example

```tsx
import { FeedbackComponent } from 'contextual-feedback-component';

function App() {
  return (
    <FeedbackComponent
      jiraConfig={{
        projectKey: 'PROJ',
        apiEndpoint: 'https://your-domain.atlassian.net',
        authToken: 'email@example.com:api-token',
      }}
      elasticConfig={{
        indexName: 'feedback',
        endpoint: 'https://elasticsearch.example.com',
        apiKey: 'your-api-key',
      }}
      appVersion="1.0.0"
      customContext={{
        environment: 'production',
        feature: 'dashboard',
      }}
      onSubmit={(feedback) => {
        console.log('Feedback submitted:', feedback);
      }}
      onError={(error) => {
        console.error('Error:', error);
      }}
    />
  );
}
```

## Types

### FeedbackData

```typescript
interface FeedbackData {
  id: string;
  timestamp: string;
  npsScore: number;
  npsSegment: 'detractor' | 'passive' | 'promoter';
  category?: 'bug' | 'feature' | 'question' | 'praise' | 'other';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  feedbackText: string;
  annotations: Annotation[];
  context: {
    url: string;
    userAgent: string;
    viewport: { width: number; height: number };
    userId?: string;
    sessionId: string;
    appVersion?: string;
    customContext?: Record<string, any>;
  };
  contactPreference: boolean;
}
```

### Annotation

```typescript
interface Annotation {
  id: string;
  type: 'element' | 'text' | 'area';
  selector?: string;
  textContent?: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshot?: string; // base64
  metadata: {
    computedStyles?: Record<string, string>;
    elementPath?: string;
    textRange?: { start: number; end: number };
  };
  timestamp: string;
}
```

## Utilities

### validateConfig

Validate component configuration.

```typescript
import { validateConfig } from 'contextual-feedback-component/utils';

const validation = validateConfig(props);
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}
```

### getErrorMessage

Get user-friendly error message.

```typescript
import { getErrorMessage } from 'contextual-feedback-component/utils';

const message = getErrorMessage(error);
```

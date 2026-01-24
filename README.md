# Contextual Feedback Component

A React component for capturing rich, contextual user feedback with visual annotations, NPS scores, and enterprise integrations (Jira, Elasticsearch).

## Features

- 🎯 **Visual Annotations**: Click, select, or draw on UI elements to provide precise feedback
- 📊 **NPS Collection**: Standard Net Promoter Score rating with contextual follow-ups
- 🔗 **Enterprise Integrations**: Automatic issue creation in Jira and indexing in Elasticsearch
- 🎨 **Customizable**: Theme, positioning, and behavior configuration
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 🚀 **Lightweight**: < 50KB gzipped
- 📸 **Screenshots**: Automatic screenshot generation for annotations
- 🔐 **Secure**: Multiple authentication methods, input sanitization

## Installation

```bash
npm install contextual-feedback-component
```

## Quick Start

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
      onSubmit={(feedback) => {
        console.log('Feedback submitted:', feedback);
      }}
    />
  );
}
```

## Documentation

- [API Reference](./docs/API.md) - Complete API documentation
- [Integration Guides](./docs/INTEGRATION_GUIDES.md) - Jira and Elasticsearch setup
- [Examples](./examples/) - Example implementations

## Features Overview

### Visual Annotations

- **Element Selection**: Click any UI element to annotate it
- **Text Selection**: Select text to provide feedback about copy
- **Area Selection**: Draw rectangular regions to annotate layouts
- **Screenshots**: Automatic screenshot generation for all annotations

### Feedback Collection

- **NPS Rating**: 0-10 scale with segment-based follow-up questions
- **Categories**: Bug, Feature Request, Question, Praise, Other
- **Severity**: Optional severity levels for bug reports
- **Rich Text**: Multi-line feedback with validation

### Enterprise Integrations

- **Jira**: Create issues with annotations and screenshots
- **Elasticsearch**: Index feedback for analytics and search
- **Multiple Auth Methods**: Token, Basic, OAuth 2.0, Custom
- **Retry Logic**: Automatic retry with exponential backoff

### Configuration

- **Theme**: Light, dark, or auto (follows system)
- **Position**: Toolbar position (bottom-right, bottom-left, etc.)
- **Custom Context**: Pass additional metadata
- **Selector Priority**: Customize element selector generation
- **Screenshot Quality**: Adjust image quality and size

## Examples

### Basic Usage

```tsx
<FeedbackComponent
  onSubmit={(feedback) => console.log(feedback)}
/>
```

### With Jira

```tsx
<FeedbackComponent
  jiraConfig={{
    projectKey: 'PROJ',
    apiEndpoint: 'https://your-domain.atlassian.net',
    authToken: 'email@example.com:api-token',
  }}
/>
```

### With Elasticsearch

```tsx
<FeedbackComponent
  elasticConfig={{
    indexName: 'feedback',
    endpoint: 'https://elasticsearch.example.com',
    apiKey: 'your-api-key',
  }}
/>
```

### Custom Configuration

```tsx
<FeedbackComponent
  position="top-left"
  theme="dark"
  accentColor="#ff6b6b"
  maxAnnotations={5}
  screenshotQuality={0.9}
  customContext={{
    environment: 'production',
    feature: 'dashboard',
  }}
  selectorPriority={['data-testid', 'id', 'unique-class']}
/>
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Requirements

- React 18+
- Modern browser with ES2020 support

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build
npm run build

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See [docs/](./docs/) directory

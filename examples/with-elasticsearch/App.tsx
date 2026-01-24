/**
 * Example with Elasticsearch Integration
 */

import React from 'react';
import { FeedbackComponent } from '../../src';

function App() {
  // In production, get these from environment variables
  const elasticConfig = {
    indexName: import.meta.env.VITE_ELASTICSEARCH_INDEX_NAME || 'user-feedback',
    endpoint: import.meta.env.VITE_ELASTICSEARCH_ENDPOINT || 'https://your-elasticsearch.com',
    apiKey: import.meta.env.VITE_ELASTICSEARCH_API_KEY,
    createIndexIfNotExists: true,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Feedback Component - Elasticsearch Integration Example</h1>
      <p>Feedback will be automatically indexed in Elasticsearch.</p>

      <section style={{ marginTop: '3rem' }}>
        <h2>Try It Out</h2>
        <p>Submit feedback and it will be indexed in Elasticsearch for analysis.</p>
        <ul>
          <li>All feedback data is searchable</li>
          <li>NPS scores are aggregated</li>
          <li>Annotations are stored as nested objects</li>
        </ul>
      </section>

      <FeedbackComponent
        elasticConfig={elasticConfig}
        appVersion="1.0.0"
        customContext={{
          environment: 'production',
          region: 'us-east-1',
        }}
        onSubmit={(feedback) => {
          console.log('Feedback indexed in Elasticsearch:', feedback);
          alert('Feedback indexed! Check your Elasticsearch cluster.');
        }}
        onError={(error) => {
          console.error('Elasticsearch error:', error);
          alert(`Error: ${error.message}`);
        }}
      />
    </div>
  );
}

export default App;

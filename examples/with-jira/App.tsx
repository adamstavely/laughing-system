/**
 * Example with Jira Integration
 */

import React from 'react';
import { FeedbackComponent } from '../../src';

function App() {
  // In production, get these from environment variables
  const jiraConfig = {
    projectKey: import.meta.env.VITE_JIRA_PROJECT_KEY || 'PROJ',
    apiEndpoint: import.meta.env.VITE_JIRA_API_ENDPOINT || 'https://your-domain.atlassian.net',
    authMethod: 'token' as const,
    authToken: import.meta.env.VITE_JIRA_AUTH_TOKEN || 'email@example.com:api-token',
    issueType: 'Task',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Feedback Component - Jira Integration Example</h1>
      <p>Feedback will be automatically created as Jira issues.</p>

      <section style={{ marginTop: '3rem' }}>
        <h2>Try It Out</h2>
        <p>Click the feedback button and submit feedback. It will create a Jira issue!</p>
        <ul>
          <li>Select elements to annotate</li>
          <li>Provide NPS score and feedback</li>
          <li>Submit to create a Jira issue</li>
        </ul>
      </section>

      <FeedbackComponent
        jiraConfig={jiraConfig}
        appVersion="1.0.0"
        customContext={{
          environment: 'development',
          feature: 'example-page',
        }}
        onSubmit={(feedback) => {
          console.log('Feedback submitted to Jira:', feedback);
          alert('Feedback submitted! Check your Jira project.');
        }}
        onError={(error) => {
          console.error('Jira error:', error);
          alert(`Error: ${error.message}`);
        }}
      />
    </div>
  );
}

export default App;

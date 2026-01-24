/**
 * Basic Example - Minimal setup
 */

import React from 'react';
import { FeedbackComponent } from '../../src';

function App() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Feedback Component - Basic Example</h1>
      <p>Click the feedback button in the bottom-right corner to try it out!</p>

      <section style={{ marginTop: '3rem' }}>
        <h2>Sample Content</h2>
        <p>This is some sample content that you can annotate.</p>
        <button data-testid="demo-button">Click Me</button>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2>Another Section</h2>
        <div id="demo-card" style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3>Card Title</h3>
          <p>Card content goes here.</p>
        </div>
      </section>

      <FeedbackComponent
        onSubmit={(feedback) => {
          console.log('Feedback submitted:', feedback);
          alert('Feedback submitted! Check console for details.');
        }}
        onError={(error) => {
          console.error('Error:', error);
          alert(`Error: ${error.message}`);
        }}
      />
    </div>
  );
}

export default App;

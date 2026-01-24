/**
 * Jira Integration
 */

import type { JiraConfig, FeedbackData } from '../types';
import { getJiraAuthHeaders } from '../utils/auth';

export interface JiraIssue {
  fields: {
    project: { key: string };
    summary: string;
    description: string;
    issuetype: { name: string };
    labels?: string[];
    [key: string]: any; // For custom fields
  };
}

/**
 * Transform feedback data to Jira issue format
 */
function transformToJiraIssue(
  feedback: FeedbackData,
  config: JiraConfig
): JiraIssue {
  const { npsScore, npsSegment, category, severity, feedbackText, annotations, context } = feedback;

  // Generate summary
  const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Feedback';
  const summary = `[User Feedback] ${categoryLabel} - ${new URL(context.url).pathname}`;

  // Build description
  const descriptionParts: string[] = [];
  
  descriptionParts.push(`*User Feedback:*\n${feedbackText}\n`);
  
  descriptionParts.push('*Metadata:*');
  descriptionParts.push(`* NPS Score: ${npsScore} (${npsSegment})`);
  if (category) {
    descriptionParts.push(`* Category: ${category}`);
  }
  if (severity) {
    descriptionParts.push(`* Severity: ${severity}`);
  }
  descriptionParts.push('');

  if (annotations.length > 0) {
    descriptionParts.push('*Annotations:*');
    annotations.forEach((annotation, index) => {
      descriptionParts.push(`${index + 1}. ${annotation.type}: ${annotation.selector || 'N/A'}`);
      if (annotation.textContent) {
        descriptionParts.push(`   Text: "${annotation.textContent.substring(0, 100)}"`);
      }
    });
    descriptionParts.push('');
  }

  descriptionParts.push('*Context:*');
  descriptionParts.push(`* URL: ${context.url}`);
  descriptionParts.push(`* Browser: ${context.userAgent}`);
  if (context.userId) {
    descriptionParts.push(`* User: ${context.userId}`);
  }
  descriptionParts.push(`* Timestamp: ${feedback.timestamp}`);
  if (context.appVersion) {
    descriptionParts.push(`* App Version: ${context.appVersion}`);
  }

  const description = descriptionParts.join('\n');

  // Build labels
  const labels = ['user-feedback', npsSegment];
  if (category) {
    labels.push(category);
  }

  // Build issue
  const issue: JiraIssue = {
    fields: {
      project: { key: config.projectKey },
      summary,
      description,
      issuetype: { name: config.issueType || 'Task' },
      labels,
      ...config.customFields,
    },
  };

  return issue;
}

/**
 * Upload attachment to Jira issue
 */
async function uploadJiraAttachment(
  issueIdOrKey: string,
  screenshot: string,
  config: JiraConfig,
  index: number
): Promise<void> {
  const endpoint = `${config.apiEndpoint}/rest/api/3/issue/${issueIdOrKey}/attachments`;

  // Convert base64 to blob
  const base64Data = screenshot.split(',')[1] || screenshot;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });

  const formData = new FormData();
  formData.append('file', blob, `annotation-${index + 1}.jpg`);

  const headers: Record<string, string> = {
    'X-Atlassian-Token': 'no-check', // Required for attachments
    ...config.headers,
  };

  // Add authentication
  const authHeaders = await getJiraAuthHeaders(config);
  Object.assign(headers, authHeaders);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`Failed to upload attachment ${index + 1}: ${errorText}`);
    // Don't throw - attachment failure shouldn't fail the whole submission
  }
}

/**
 * Create Jira issue via REST API
 */
async function createJiraIssue(
  feedback: FeedbackData,
  config: JiraConfig
): Promise<{ issueId: string; issueKey: string; url: string }> {
  const issue = transformToJiraIssue(feedback, config);
  
  const endpoint = `${config.apiEndpoint}/rest/api/3/issue`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  // Add authentication
  const authHeaders = await getJiraAuthHeaders(config);
  Object.assign(headers, authHeaders);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(issue),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Jira API error (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();
  
  // Upload screenshots as attachments
  const attachmentPromises = feedback.annotations
    .filter((annotation) => annotation.screenshot)
    .map((annotation, index) =>
      uploadJiraAttachment(result.key, annotation.screenshot!, config, index)
    );

  // Upload attachments in parallel (don't wait for all to complete)
  Promise.allSettled(attachmentPromises).catch((error) => {
    console.warn('Some attachments failed to upload:', error);
  });
  
  return {
    issueId: result.id,
    issueKey: result.key,
    url: `${config.apiEndpoint}/browse/${result.key}`,
  };
}

/**
 * Retry logic with exponential backoff
 */
export async function createJiraIssueWithRetry(
  feedback: FeedbackData,
  config: JiraConfig,
  maxRetries: number = 3
): Promise<{ issueId: string; issueKey: string; url: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await createJiraIssue(feedback, config);
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

  throw lastError || new Error('Failed to create Jira issue after retries');
}

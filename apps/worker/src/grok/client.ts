import { config } from '../config.js';
import type { EventSummary } from '@event-monitor/shared';

interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokChatOptions {
  messages: GrokChatMessage[];
  model?: string;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

interface GrokEmbeddingOptions {
  input: string | string[];
  model?: string;
}

export class GrokClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.grok.apiKey;
    this.baseUrl = config.grok.baseUrl;
  }

  /**
   * Generate embeddings for text
   */
  async createEmbeddings(options: GrokEmbeddingOptions): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model ?? 'grok-embedding',
        input: options.input,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }

  /**
   * Generate a single embedding
   */
  async createEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.createEmbeddings({ input: text });
    return embeddings[0];
  }

  /**
   * Chat completion
   */
  async chat(options: GrokChatOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model ?? 'grok-2',
        messages: options.messages,
        max_tokens: options.maxTokens ?? 1024,
        response_format: options.responseFormat,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Score content quality for filtering
   */
  async scoreContent(text: string): Promise<number> {
    const prompt = `You are evaluating social media content quality for news event detection.
Rate this content on a scale of 0 to 1 based on:
- Informational value (is it reporting something newsworthy?)
- Credibility (does it seem factual vs opinion/spam?)
- Clarity (is the message clear and understandable?)

Content: "${text.slice(0, 500)}"

Respond with ONLY a number between 0 and 1, nothing else.`;

    const response = await this.chat({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 10,
    });

    const score = parseFloat(response.trim());
    return isNaN(score) ? 0.5 : Math.min(1, Math.max(0, score));
  }

  /**
   * Summarize a cluster of posts into an event
   */
  async summarizeCluster(posts: string[]): Promise<EventSummary> {
    const prompt = `Analyze the following collection of social media posts about a potential news event.
Generate a structured summary with:

1. TITLE: A concise headline (max 100 chars)
2. SUMMARY: 2-3 sentence description of the event
3. EVENT_TYPE: One of [conflict, humanitarian, political, military, protest, other]
4. CONFIDENCE: Your confidence score (0-1) that this represents a real, coherent event
5. LOCATION: If a specific location is mentioned, extract it. Format: "City, Country" or "Region, Country"
   - Return null if no location is discernible

Posts:
${posts.map((p, i) => `[${i + 1}] ${p}`).join('\n\n')}

Respond in JSON format with this exact structure:
{
  "title": "string",
  "summary": "string",
  "eventType": "string",
  "confidence": number,
  "location": "string or null"
}`;

    const response = await this.chat({
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' },
    });

    try {
      return JSON.parse(response);
    } catch {
      throw new Error(`Failed to parse Grok response: ${response}`);
    }
  }
}

export const grokClient = new GrokClient();

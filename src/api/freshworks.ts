/**
 * Freshservice API client
 *
 * API Docs: https://api.freshservice.com/
 */

import type { FreshTicket, FreshTicketCreatePayload } from '../types.js';

export interface FreshworksConfig {
  domain: string;      // e.g., "yourcompany.freshservice.com"
  apiKey: string;
}

export class FreshworksClient {
  private baseUrl: string;
  private headers: Headers;

  constructor(config: FreshworksConfig) {
    this.baseUrl = `https://${config.domain}/api/v2`;
    // Freshservice uses Basic Auth with API key as username, 'X' as password
    const auth = Buffer.from(`${config.apiKey}:X`).toString('base64');
    this.headers = new Headers({
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    });
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Freshservice API error ${response.status}: ${text}`);
    }

    return response.json();
  }

  /**
   * Get a ticket by ID
   */
  async getTicket(id: number): Promise<FreshTicket> {
    const result = await this.request<{ ticket: FreshTicket }>('GET', `/tickets/${id}`);
    return result.ticket;
  }

  /**
   * Get tickets assigned to current user
   */
  async getMyTickets(): Promise<FreshTicket[]> {
    // Filter: new_and_my_open gets tickets assigned to me that are open
    const result = await this.request<{ tickets: FreshTicket[] }>(
      'GET',
      '/tickets?filter=new_and_my_open'
    );
    return result.tickets;
  }

  /**
   * Create a new ticket
   */
  async createTicket(payload: FreshTicketCreatePayload): Promise<FreshTicket> {
    const result = await this.request<{ ticket: FreshTicket }>(
      'POST',
      '/tickets',
      { ticket: payload }
    );
    return result.ticket;
  }

  /**
   * Update a ticket
   */
  async updateTicket(
    id: number,
    updates: Partial<FreshTicketCreatePayload>
  ): Promise<FreshTicket> {
    const result = await this.request<{ ticket: FreshTicket }>(
      'PUT',
      `/tickets/${id}`,
      { ticket: updates }
    );
    return result.ticket;
  }

  /**
   * Add a note to a ticket
   */
  async addNote(
    ticketId: number,
    body: string,
    isPrivate = true
  ): Promise<void> {
    await this.request('POST', `/tickets/${ticketId}/notes`, {
      body,
      private: isPrivate,
    });
  }

  /**
   * Close a ticket
   */
  async closeTicket(id: number, resolution?: string): Promise<FreshTicket> {
    const updates: Partial<FreshTicketCreatePayload> & { status: number } = {
      status: 5, // Closed in Freshservice
    };
    if (resolution) {
      // Add resolution as a note before closing
      await this.addNote(id, `**Resolution:**\n${resolution}`);
    }
    return this.updateTicket(id, updates);
  }

  /**
   * Format ticket ID for display (e.g., "INC-1234")
   */
  static formatTicketId(id: number, type: 'Incident' | 'Service Request' = 'Incident'): string {
    const prefix = type === 'Incident' ? 'INC' : 'SR';
    return `${prefix}-${id}`;
  }

  /**
   * Parse ticket ID from string (e.g., "INC-1234" -> 1234)
   */
  static parseTicketId(idString: string): number {
    const match = idString.match(/(?:INC|SR)-?(\d+)/i);
    if (!match) {
      throw new Error(`Invalid ticket ID format: ${idString}`);
    }
    return parseInt(match[1], 10);
  }
}

/**
 * Create client from environment variables
 */
export function createFreshworksClient(): FreshworksClient {
  const domain = process.env.FRESH_DOMAIN;
  const apiKey = process.env.FRESH_API_KEY;

  if (!domain || !apiKey) {
    throw new Error('Missing FRESH_DOMAIN or FRESH_API_KEY environment variables');
  }

  return new FreshworksClient({ domain, apiKey });
}

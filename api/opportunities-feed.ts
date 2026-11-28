import { loadOpportunityFeeds } from '../src/server/opportunityFeeds.js';

interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  response.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=300');
  try {
    const payload = await loadOpportunityFeeds();
    response.status(200).json(payload);
  } catch {
    response.status(502).json({ error: 'Opportunity feeds are temporarily unavailable.' });
  }
}

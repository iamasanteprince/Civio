import { loadPolicyFeeds } from '../src/server/policyFeeds.js';

interface ApiRequest {
  method?: string;
  url?: string;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const payload = await loadPolicyFeeds();
    response.status(200).json(payload);
  } catch {
    response.status(502).json({ error: 'Policy feed is temporarily unavailable.' });
  }
}

import { loadPolicyFeed } from '../src/server/policyFeeds';

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

  const sourceId = new URL(request.url ?? '/', 'https://civiohub.local').searchParams.get('source');
  try {
    const payload = await loadPolicyFeed(sourceId);
    response.status(200).json(payload);
  } catch {
    response.status(502).json({ error: 'Policy feed is temporarily unavailable.' });
  }
}

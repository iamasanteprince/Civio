import { loadJobs } from '../src/server/jobs';

interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  response.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    response.status(200).json(await loadJobs());
  } catch (error) {
    console.error('Could not load remote jobs.', error);
    response.status(200).json({ jobs: [], error: true });
  }
}

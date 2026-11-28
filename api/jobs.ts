import { loadJobs } from '../src/server/jobs';
import type { JobsDiagnostic } from '../src/server/jobs';

interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

function setCacheHeaders(response: ApiResponse, hasError: boolean): void {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader(
    'Cache-Control',
    hasError
      ? 'public, s-maxage=60, stale-while-revalidate=300'
      : 'public, s-maxage=21600, stale-while-revalidate=86400'
  );
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const payload = await loadJobs();
    setCacheHeaders(response, payload.error);
    response.status(200).json(payload);
  } catch (error) {
    console.error('Could not prepare the jobs response.', error);
    const diagnostic: JobsDiagnostic = {
      source: 'Remote OK',
      code: 'service_error',
      message: 'The jobs service is temporarily unavailable.',
    };
    setCacheHeaders(response, true);
    response.status(200).json({
      jobs: [],
      error: true,
      diagnostics: [diagnostic],
    });
  }
}

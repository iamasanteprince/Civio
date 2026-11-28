import { loadJobs } from '../src/server/jobs.js';
import type { JobFeedStatus, JobsDiagnostic } from '../src/server/jobs.js';

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
    const sources: JobFeedStatus[] = [
      { source: 'Remote OK', status: 'failed', jobCount: 0 },
      { source: 'Jobicy', status: 'failed', jobCount: 0 },
      { source: 'Himalayas', status: 'failed', jobCount: 0 },
    ];
    const diagnostics: JobsDiagnostic[] = sources.map(({ source }) => ({
      source,
      code: 'service_error',
      message: `${source} could not be queried because the jobs service failed.`,
    }));
    setCacheHeaders(response, true);
    response.status(503).json({
      jobs: [],
      error: true,
      details: 'The jobs service failed before feed results were available. Please try again shortly.',
      sources,
      diagnostics,
    });
  }
}

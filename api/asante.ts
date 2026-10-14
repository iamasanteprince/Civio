import { generateAsanteResponse } from '../src/server/gemini';

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const body = request.body;
  if (!isRecord(body) || typeof body.query !== 'string' || typeof body.context !== 'string') {
    response.status(400).json({ error: 'Invalid assistant request.' });
    return;
  }
  if (!body.query.trim() || body.query.length > 2000 || body.context.length > 16000) {
    response.status(400).json({ error: 'Assistant request exceeds the allowed limits.' });
    return;
  }

  try {
    const text = await generateAsanteResponse(body.query.trim(), body.context);
    response.status(200).json({ text });
  } catch {
    response.status(502).json({ error: 'Gemini is temporarily unavailable.' });
  }
}

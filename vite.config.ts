import { defineConfig } from 'vite';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { generateAsanteResponse } from './src/server/gemini';
import { loadPolicyFeeds } from './src/server/policyFeeds';
import { loadJobs } from './src/server/jobs';

function devApiPlugin(): Plugin {
  return {
    name: 'civiohub-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/asante', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: 'Method not allowed.' }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of request) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (
            typeof body !== 'object' ||
            body === null ||
            !('query' in body) ||
            !('context' in body) ||
            typeof body.query !== 'string' ||
            typeof body.context !== 'string' ||
            !body.query.trim() ||
            body.query.length > 2000 ||
            body.context.length > 16000
          ) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: 'Invalid assistant request.' }));
            return;
          }

          const text = await generateAsanteResponse(body.query.trim(), body.context);
          response.statusCode = 200;
          response.end(JSON.stringify({ text }));
        } catch {
          response.statusCode = 502;
          response.end(JSON.stringify({ error: 'Gemini is temporarily unavailable.' }));
        }
      });
      server.middlewares.use('/api/policy-updates', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: 'Method not allowed.' }));
          return;
        }

        try {
          const payload = await loadPolicyFeeds();
          response.statusCode = 200;
          response.end(JSON.stringify(payload));
        } catch {
          response.statusCode = 502;
          response.end(JSON.stringify({ error: 'Policy feed is temporarily unavailable.' }));
        }
      });
      server.middlewares.use('/api/jobs', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.setHeader('Cache-Control', 'no-store');
          response.end(JSON.stringify({ error: 'Method not allowed.' }));
          return;
        }

        try {
          const payload = await loadJobs();
          response.statusCode = 200;
          response.setHeader(
            'Cache-Control',
            payload.error
              ? 'public, s-maxage=60, stale-while-revalidate=300'
              : 'public, s-maxage=21600, stale-while-revalidate=86400'
          );
          response.end(JSON.stringify(payload));
        } catch (error) {
          console.error('Could not prepare the jobs response.', error);
          response.statusCode = 200;
          response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
          response.end(JSON.stringify({
            jobs: [],
            error: true,
            details: 'The jobs service failed before feed results were available. Please try again shortly.',
            sources: [
              { source: 'Remote OK', status: 'failed', jobCount: 0 },
              { source: 'Jobicy', status: 'failed', jobCount: 0 },
              { source: 'Himalayas', status: 'failed', jobCount: 0 },
            ],
            diagnostics: [{
              source: 'Remote OK',
              code: 'service_error',
              message: 'The jobs service is temporarily unavailable.',
            }],
          }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (!process.env.GEMINI_API_KEY && env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    plugins: [react(), devApiPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      sourcemap: false,
    },
  };
});

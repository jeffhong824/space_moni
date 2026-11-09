import express, { type Request, type Response } from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { handleAiDoctor } from './src/server/aiDoctorHandler.ts';
import { handleSpaceEnvironment } from './src/server/spaceEnvironmentHandler.ts';
import type { ApiRequest, ApiResponse } from './src/server/http.ts';

dotenv.config();

if (process.env.DISABLE_HMR === undefined) {
  process.env.DISABLE_HMR = 'true';
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

app.post('/api/ai-doctor', (req: Request, res: Response) =>
  handleAiDoctor(req as unknown as ApiRequest, res as unknown as ApiResponse)
);

app.get('/api/nasa/space-environment', (req: Request, res: Response) =>
  handleSpaceEnvironment(req as unknown as ApiRequest, res as unknown as ApiResponse)
);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: false,
        hmr: isHmrDisabled
          ? false
          : {
              server: httpServer,
            },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SpaceMoni server listening on port ${PORT}`);
  });
}

startServer();

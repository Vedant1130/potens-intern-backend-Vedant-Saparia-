import app from './src/app.js';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Integrate Vite middleware for static assets & Hot Module Replacement in dev, or serve production client bundle
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initiating Vite Dev Server Pipeline on Express application...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static build output...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(expressStaticFallback(distPath));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Financial Recommendation Engine running on http://0.0.0.0:${PORT}`);
  });
}

// Helper to serve production assets correctly
function expressStaticFallback(distPath: string) {
  const expressInstance = require('express');
  const router = expressInstance.Router();
  router.use(expressInstance.static(distPath));
  router.get('*', (req: any, res: any) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  return router;
}

startServer().catch((err) => {
  console.error('Failed to initialize server process:', err);
  process.exit(1);
});

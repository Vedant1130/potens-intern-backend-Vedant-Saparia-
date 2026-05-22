import express from 'express';
import recommendRouter from './routes/recommend.js';
import itemsRouter from './routes/items.js';
import explainRouter from './routes/explain.js';

const app = express();

// Standard middleware
app.use(express.json());

// Mount API Endpoint routes under /api
app.use('/api/recommend', recommendRouter);
app.use('/api/items', itemsRouter);
app.use('/api/explain', explainRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;

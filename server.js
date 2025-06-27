import express from 'express';
import cors from 'cors';
import stopsHandler from './api/stops.js';

const app = express();

app.use(cors());
app.use(express.json());

// Create a wrapper to make it work with Express
app.get('/stops', async (req, res) => {
  // Mock the Vercel serverless function environment
  const mockReq = {
    method: req.method,
    query: req.query,
    headers: req.headers
  };
  
  const mockRes = {
    status: (code) => ({
      json: (data) => res.status(code).json(data),
      end: () => res.status(code).end()
    }),
    setHeader: (name, value) => res.setHeader(name, value),
    end: () => res.end()
  };
  
  await stopsHandler(mockReq, mockRes);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}); 
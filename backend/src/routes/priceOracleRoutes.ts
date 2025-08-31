import { Router } from 'express';
import { readChainlinkPrice } from '../services/chainlinkPrice';

const r = Router();

r.get('/oracle/chainlink', async (req, res) => {
  try {
    const feed = (req.query.feed as string) || undefined;
    const rpc = (req.query.rpc as string) || undefined;
    const data = await readChainlinkPrice(feed, rpc);
    res.json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message ?? 'oracle error' });
  }
});

export default r;

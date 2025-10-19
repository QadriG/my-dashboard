// server/routes/positions.mjs
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.mjs';
import { fetchUserExchangeData } from '../services/exchangeDataSync.mjs';
import { info, error as logError } from '../utils/logger.mjs';

const router = Router();

/**
 * GET /api/positions/active
 * Returns all open positions across user's connected exchanges
 */
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const data = await fetchUserExchangeData(req.user.id);
    
    // Flatten all positions from all exchanges
    const allPositions = data.flatMap(item => {
      if (!item.openPositions || !Array.isArray(item.openPositions)) {
        return [];
      }
      return item.openPositions.map(pos => ({
        ...pos,
        exchange: item.exchange,
        type: item.type
      }));
    });

    info(`Fetched ${allPositions.length} active positions for user ${req.user.id}`);
    res.json(allPositions);
  } catch (err) {
    logError(`Failed to fetch active positions for user ${req.user.id}`, err);
    res.status(500).json([]);
  }
});

export default router;
import express from 'express';
import { createStamp, getNearbyStamps, collectStamp, getMyStamps } from '../controllers/stampController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createStamp);
router.get('/nearby', protect, getNearbyStamps);
router.post('/collect', protect, collectStamp);
router.get('/my-stamps', protect, getMyStamps);

export default router;
import { Lot } from '../types/index.js';
import { RAW_LOTS as PRODUCT_POOL } from './productPool.js';

export function generateSeedLots(concurrentOpenCount = 4): Record<string, Lot> {
  const map: Record<string, Lot> = {};

  PRODUCT_POOL.forEach((raw, index) => {
    const queueOrder = index + 1;
    const isOpen = queueOrder <= concurrentOpenCount;
    const initialSeconds = 60;
    const product = {
      id: raw.id,
      name: raw.title,
      category: raw.category,
      startingBid: raw.basePrice,
      fairValue: raw.fairValue
    };

    map[raw.id] = {
      lotId: raw.id,
      id: raw.id,
      product,
      title: raw.title,
      category: raw.category,
      description: raw.description,
      specifications: raw.specifications,
      basePrice: raw.basePrice,
      fairValue: raw.fairValue,
      currentBid: raw.basePrice,
      minIncrement: raw.minIncrement,
      highestBidderId: null,
      highestBidderTeamId: null,
      highestBidderTeamName: null,
      status: isOpen ? 'open' : 'upcoming',
      timeRemainingMs: initialSeconds * 1000,
      initialTimeSeconds: initialSeconds,
      timeLeftSeconds: initialSeconds,
      bidsCount: 0,
      bidHistory: [],
      extensionsUsed: 0,
      extensionsCount: 0,
      maxExtensions: 3,
      hardTimeCeilingSeconds: 90,
      queueOrder
    };
  });

  return map;
}

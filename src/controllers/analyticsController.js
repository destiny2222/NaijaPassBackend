import { eq, gte, lt } from 'drizzle-orm';
import cache from 'memory-cache';
import db from '../db/index.js';
import { bidsTable, bidCategoriesTable, kycsTable, industryCategoriesTable } from '../db/schema.js';

const ANALYTICS_CACHE_KEY = 'dashboard_analytics';
const CACHE_TTL_MS = 60000; // Cache for 60 seconds

export async function getDashboardAnalytics(req, res) {
  try {
    // Check if data is already cached
    const cachedData = cache.get(ANALYTICS_CACHE_KEY);
    if (cachedData) {
      console.log('Serving dashboard analytics from cache...');
      return res.json({
        success: true,
        fromCache: true,
        data: cachedData
      });
    }

    console.log('Cache miss. Generating new dashboard analytics...');
    const now = new Date();

    // 1. Bids Status Breakdown (Active vs Closed)
    const activeBids = await db.select().from(bidsTable).where(gte(bidsTable.deadline, now));
    const closedBids = await db.select().from(bidsTable).where(lt(bidsTable.deadline, now));

    // 2. KYC Status Breakdown
    const allKycs = await db.select().from(kycsTable);
    const kycStatusCounts = {
      pending: 0,
      inprogress: 0,
      approved: 0,
      rejected: 0
    };
    allKycs.forEach(kyc => {
      if (kycStatusCounts[kyc.status] !== undefined) {
        kycStatusCounts[kyc.status]++;
      }
    });

    // 3. Bids by Category
    const bidCategories = await db.select().from(bidCategoriesTable);
    const bidsByCategory = [];
    for (const cat of bidCategories) {
      const countResult = await db.select().from(bidsTable).where(eq(bidsTable.categoryId, cat.id));
      bidsByCategory.push({
        categoryId: cat.id,
        categoryName: cat.name,
        count: countResult.length
      });
    }

    // 4. KYCs by Industry Category
    const industryCategories = await db.select().from(industryCategoriesTable);
    const kycsByIndustry = [];
    for (const cat of industryCategories) {
      const countResult = await db.select().from(kycsTable).where(eq(kycsTable.industryCategoryId, cat.id));
      kycsByIndustry.push({
        categoryId: cat.id,
        categoryName: cat.name,
        count: countResult.length
      });
    }

    const analyticsData = {
      bidsSummary: {
        total: activeBids.length + closedBids.length,
        active: activeBids.length,
        closed: closedBids.length
      },
      kycSummary: {
        total: allKycs.length,
        ...kycStatusCounts
      },
      bidsByCategory,
      kycsByIndustry
    };

    // Store in memory-cache
    cache.put(ANALYTICS_CACHE_KEY, analyticsData, CACHE_TTL_MS);

    return res.json({
      success: true,
      fromCache: false,
      data: analyticsData
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve analytics', error: err.message });
  }
}

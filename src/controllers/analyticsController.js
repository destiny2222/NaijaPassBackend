import { and, eq, gte, lt } from 'drizzle-orm';
import cache from 'memory-cache';
import db from '../db/index.js';
import { bidsTable, bidCategoriesTable, kycsTable, industryCategoriesTable } from '../db/schema.js';

const ANALYTICS_CACHE_KEY = 'dashboard_analytics';
const CACHE_TTL_MS = 60000; // Cache for 60 seconds

export async function getDashboardAnalytics(req, res) {
  try {
    const requestedUserId = req.query.userId;
    const targetUserId = req.user.role === 'admin' ? requestedUserId : req.user.id;
    const isUserScoped = Boolean(targetUserId);
    const cacheKey = isUserScoped ? `${ANALYTICS_CACHE_KEY}:${targetUserId}` : ANALYTICS_CACHE_KEY;

    // Check if data is already cached
    const cachedData = cache.get(cacheKey);
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
    const userBidCondition = isUserScoped ? eq(bidsTable.createdById, targetUserId) : undefined;

    // 1. Bids Status Breakdown (Active vs Closed)
    const activeBids = await db.select()
      .from(bidsTable)
      .where(userBidCondition ? and(userBidCondition, gte(bidsTable.deadline, now)) : gte(bidsTable.deadline, now));
    const closedBids = await db.select()
      .from(bidsTable)
      .where(userBidCondition ? and(userBidCondition, lt(bidsTable.deadline, now)) : lt(bidsTable.deadline, now));

    // 2. KYC Status Breakdown
    const allKycs = isUserScoped
      ? await db.select().from(kycsTable).where(eq(kycsTable.userId, targetUserId))
      : await db.select().from(kycsTable);
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
    const hasApprovedBusinessKyc = allKycs.some(kyc => (
      kyc.type === 'business' && kyc.status === 'approved'
    ));
    const canCreateBid = isUserScoped ? hasApprovedBusinessKyc : req.user.role === 'admin';

    // 3. Bids by Category
    const bidCategories = await db.select().from(bidCategoriesTable);
    const bidsByCategory = [];
    for (const cat of bidCategories) {
      const categoryCondition = eq(bidsTable.categoryId, cat.id);
      const countResult = await db.select()
        .from(bidsTable)
        .where(userBidCondition ? and(userBidCondition, categoryCondition) : categoryCondition);
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
      const countResult = allKycs.filter(kyc => kyc.industryCategoryId === cat.id);
      kycsByIndustry.push({
        categoryId: cat.id,
        categoryName: cat.name,
        count: countResult.length
      });
    }

    const analyticsData = {
      scope: {
        userId: targetUserId || null,
        isGlobal: !isUserScoped
      },
      bidsSummary: {
        total: activeBids.length + closedBids.length,
        active: activeBids.length,
        closed: closedBids.length
      },
      kycSummary: {
        total: allKycs.length,
        ...kycStatusCounts
      },
      permissions: {
        canCreateBid
      },
      bidsByCategory,
      kycsByIndustry
    };

    // Store in memory-cache
    cache.put(cacheKey, analyticsData, CACHE_TTL_MS);

    return res.json({
      success: true,
      fromCache: false,
      data: analyticsData
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve analytics', error: err.message });
  }
}

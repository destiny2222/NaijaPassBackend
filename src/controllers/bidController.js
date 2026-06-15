import { randomUUID } from 'crypto';
import { eq, and, gte, lt, like } from 'drizzle-orm';
import moment from 'moment';
import db from '../db/index.js';
import { bidsTable, bidCategoriesTable } from '../db/schema.js';

// Get Bid Categories
export async function getBidCategories(req, res) {
  try {
    const categories = await db.select().from(bidCategoriesTable);
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve bid categories', error: err.message });
  }
}

// Add Bid Category (Admin only / Utility)
export async function addBidCategory(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    await db.insert(bidCategoriesTable).values({ name });
    return res.status(201).json({ success: true, message: 'Bid category added successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add bid category', error: err.message });
  }
}

// Create Bid (Admin only)
export async function createBid(req, res) {
  try {
    const { title, bidNumber, deadline, agency, categoryId } = req.body;
    if (!title || !bidNumber || !deadline || !agency) {
      return res.status(400).json({ success: false, message: 'Title, bidNumber, deadline, and agency are required' });
    }

    // Verify category exists if provided
    if (categoryId) {
      const cat = await db.select().from(bidCategoriesTable).where(eq(bidCategoriesTable.id, categoryId)).limit(1);
      if (cat.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid categoryId' });
      }
    }

    const bidId = randomUUID();

    await db.insert(bidsTable).values({
      id: bidId,
      title,
      bidNumber,
      deadline: new Date(deadline),
      agency,
      categoryId: categoryId || null
    });

    return res.status(201).json({
      success: true,
      message: 'Bid created successfully',
      data: { id: bidId, title, bidNumber, deadline, agency, categoryId }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create bid', error: err.message });
  }
}

// List Bids (Public)
export async function listBids(req, res) {
  try {
    const { categoryId, search, status } = req.query;
    
    // Construct dynamic where clause
    const conditions = [];

    if (categoryId) {
      conditions.push(eq(bidsTable.categoryId, parseInt(categoryId)));
    }

    if (search) {
      conditions.push(like(bidsTable.title, `%${search}%`));
    }

    const now = new Date();
    if (status === 'active') {
      conditions.push(gte(bidsTable.deadline, now));
    } else if (status === 'closed') {
      conditions.push(lt(bidsTable.deadline, now));
    }

    // Standard SQL Join query
    let query = db.select()
      .from(bidsTable)
      .leftJoin(bidCategoriesTable, eq(bidsTable.categoryId, bidCategoriesTable.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const bids = await query;

    // Calculate dynamic time remaining using moment
    const processedBids = bids.map(row => {
      const bid = row.bids;
      const category = row.bid_categories;
      
      const daysRemaining = moment(bid.deadline).diff(moment(), 'days');
      
      return {
        id: bid.id,
        title: bid.title,
        bidNumber: bid.bidNumber,
        deadline: bid.deadline,
        agency: bid.agency,
        categoryId: bid.categoryId,
        category: category ? { id: category.id, name: category.name } : null,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        status: daysRemaining > 0 ? 'active' : 'closed',
        formattedDeadline: moment(bid.deadline).format('MMMM Do YYYY')
      };
    });

    return res.json({ success: true, data: processedBids });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve bids', error: err.message });
  }
}

// Get Single Bid Details
export async function getBidDetails(req, res) {
  try {
    const { id } = req.params;
    
    const result = await db.select()
      .from(bidsTable)
      .leftJoin(bidCategoriesTable, eq(bidsTable.categoryId, bidCategoriesTable.id))
      .where(eq(bidsTable.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const { bids: bid, bid_categories: category } = result[0];
    const daysRemaining = moment(bid.deadline).diff(moment(), 'days');

    return res.json({
      success: true,
      data: {
        id: bid.id,
        title: bid.title,
        bidNumber: bid.bidNumber,
        deadline: bid.deadline,
        agency: bid.agency,
        categoryId: bid.categoryId,
        category: category ? { id: category.id, name: category.name } : null,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        status: daysRemaining > 0 ? 'active' : 'closed',
        formattedDeadline: moment(bid.deadline).format('MMMM Do YYYY, h:mm a')
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve bid details', error: err.message });
  }
}

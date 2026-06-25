import { randomUUID } from 'crypto';
import { eq, and, gte, lt, like, or } from 'drizzle-orm';
import moment from 'moment';
import db from '../db/index.js';
import { bidsTable, bidCategoriesTable, kycsTable, bidApplicationsTable, bidReviewsTable, usersTable } from '../db/schema.js';

const BID_STATUSES = ['draft', 'published', 'cancelled', 'awarded'];

async function canManageBids(user) {
  if (user.role === 'admin') {
    return true;
  }

  const approvedBusinessKyc = await db.select()
    .from(kycsTable)
    .where(and(
      eq(kycsTable.userId, user.id),
      eq(kycsTable.type, 'business'),
      eq(kycsTable.status, 'approved')
    ))
    .limit(1);

  return approvedBusinessKyc.length > 0;
}

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

// Create Bid (Admin or verified business only)
export async function createBid(req, res) {
  try {
    const {
      title,
      bidNumber,
      deadline,
      agency,
      procuringEntity,
      sector,
      location,
      description,
      status,
      bidStatus,
      categoryId
    } = req.body;
    if (!title || !bidNumber || !deadline || !agency) {
      return res.status(400).json({ success: false, message: 'Title, bidNumber, deadline, and agency are required' });
    }

    const normalizedStatus = status || bidStatus || 'published';
    if (!BID_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if (!(await canManageBids(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: only admins or businesses with approved KYC can create bids'
      });
    }

    // Verify category exists if provided
    if (categoryId) {
      const cat = await db.select().from(bidCategoriesTable).where(eq(bidCategoriesTable.id, categoryId)).limit(1);
      if (cat.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid categoryId' });
      }
    }

    const bidId = randomUUID();
    const generatedSlug = title.toLowerCase();

    await db.insert(bidsTable).values({
      id: bidId,
      createdById: req.user.id,
      title,
      slug: generatedSlug,
      bidNumber,
      deadline: new Date(deadline),
      agency,
      procuringEntity: procuringEntity || null,
      sector: sector || null,
      location: location || null,
      description: description || null,
      status: normalizedStatus,
      categoryId: categoryId || null,
      formSchema: formSchema || null
    });

    return res.status(201).json({
      success: true,
      message: 'Bid created successfully',
      data: {
        id: bidId,
        createdById: req.user.id,
        title,
        bidNumber,
        deadline,
        agency,
        procuringEntity: procuringEntity || null,
        sector: sector || null,
        location: location || null,
        description: description || null,
        bidStatus: normalizedStatus,
        slug: generatedSlug,
        categoryId,
        formSchema: formSchema || null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create bid', error: err.message });
  }
}

// update bid ( Admin or verified business only)
export async function updateBid(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      bidNumber,
      deadline,
      agency,
      procuringEntity,
      sector,
      location,
      description,
      status,
      bidStatus,
      categoryId
    } = req.body;

    if (!(await canManageBids(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: only admins or businesses with approved KYC can update bids'
      });
    }

    const existingBid = await db.select().from(bidsTable).where(eq(bidsTable.id, id)).limit(1);
    if (existingBid.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (bidNumber !== undefined) {
      updateData.bidNumber = bidNumber;
    }

    if (deadline !== undefined) {
      const parsedDeadline = new Date(deadline);
      if (Number.isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid deadline' });
      }
      updateData.deadline = parsedDeadline;
    }

    if (agency !== undefined) {
      updateData.agency = agency;
    }

    if (procuringEntity !== undefined) {
      updateData.procuringEntity = procuringEntity;
    }

    if (sector !== undefined) {
      updateData.sector = sector;
    }

    if (location !== undefined) {
      updateData.location = location;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (status !== undefined || bidStatus !== undefined) {
      const normalizedStatus = status !== undefined ? status : bidStatus;
      if (!BID_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updateData.status = normalizedStatus;
    }

    if (categoryId !== undefined) {
      if (categoryId === null) {
        updateData.categoryId = null;
      } else {
        const cat = await db.select().from(bidCategoriesTable).where(eq(bidCategoriesTable.id, categoryId)).limit(1);
        if (cat.length === 0) {
          return res.status(400).json({ success: false, message: 'Invalid categoryId' });
        }
        updateData.categoryId = categoryId;
      }
    }

    if (formSchema !== undefined) {
      updateData.formSchema = formSchema;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field is required to update'
      });
    }

    await db.update(bidsTable).set(updateData).where(eq(bidsTable.id, id));

    const updatedBidResult = await db.select()
      .from(bidsTable)
      .leftJoin(bidCategoriesTable, eq(bidsTable.categoryId, bidCategoriesTable.id))
      .where(eq(bidsTable.id, id))
      .limit(1);

    const { bids: bid, bid_categories: category } = updatedBidResult[0];

    return res.json({
      success: true,
      message: 'Bid updated successfully',
      data: {
        id: bid.id,
        createdById: bid.createdById,
        title: bid.title,
        bidNumber: bid.bidNumber,
        deadline: bid.deadline,
        agency: bid.agency,
        procuringEntity: bid.procuringEntity,
        sector: bid.sector,
        location: bid.location,
        description: bid.description,
        bidStatus: bid.status,
        slug: bid.slug,
        categoryId: bid.categoryId,
        category: category ? { id: category.id, name: category.name } : null,
        formSchema: bid.formSchema
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update bid', error: err.message });
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
        createdById: bid.createdById,
        title: bid.title,
        bidNumber: bid.bidNumber,
        deadline: bid.deadline,
        agency: bid.agency,
        procuringEntity: bid.procuringEntity,
        sector: bid.sector,
        location: bid.location,
        description: bid.description,
        bidStatus: bid.status,
        slug: bid.slug,
        categoryId: bid.categoryId,
        category: category ? { id: category.id, name: category.name } : null,
        formSchema: bid.formSchema,
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
      .where(or(eq(bidsTable.id, id), eq(bidsTable.slug, id)))
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
        createdById: bid.createdById,
        title: bid.title,
        bidNumber: bid.bidNumber,
        deadline: bid.deadline,
        agency: bid.agency,
        procuringEntity: bid.procuringEntity,
        sector: bid.sector,
        location: bid.location,
        description: bid.description,
        bidStatus: bid.status,
        slug: bid.slug,
        categoryId: bid.categoryId,
        category: category ? { id: category.id, name: category.name } : null,
        formSchema: bid.formSchema,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        status: daysRemaining > 0 ? 'active' : 'closed',
        formattedDeadline: moment(bid.deadline).format('MMMM Do YYYY, h:mm a')
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve bid details', error: err.message });
  }
}

// Apply for a bid
export async function applyForBid(req, res) {
  try {
    const { id } = req.params;
    const { proposalText, proposedAmount, formData } = req.body;
    const userId = req.user.id;

    if (!proposalText && !formData) {
      return res.status(400).json({ success: false, message: 'proposalText or formData is required' });
    }

    // Check if the bid exists
    const bidResult = await db.select().from(bidsTable).where(or(eq(bidsTable.id, id), eq(bidsTable.slug, id))).limit(1);
    if (bidResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }
    const bid = bidResult[0];

    // Check if the user is the creator of the bid
    if (bid.createdById === userId) {
      return res.status(403).json({ success: false, message: 'You cannot apply to your own bid' });
    }

    // Check if the user has already applied
    const existingApplication = await db.select()
      .from(bidApplicationsTable)
      .where(and(eq(bidApplicationsTable.bidId, bid.id), eq(bidApplicationsTable.userId, userId)))
      .limit(1);

    if (existingApplication.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already applied for this bid' });
    }

    // Validate formData against formSchema if it exists
    if (bid.formSchema && Array.isArray(bid.formSchema)) {
      if (!formData) {
        return res.status(400).json({ success: false, message: 'formData is required based on the bid requirements' });
      }
      for (const field of bid.formSchema) {
        if (field.required) {
          const value = formData[field.name];
          if (value === undefined || value === null || value === '') {
            return res.status(400).json({ success: false, message: `Field ${field.name} is required` });
          }
        }
      }
    }

    // Create application
    const applicationId = randomUUID();
    await db.insert(bidApplicationsTable).values({
      id: applicationId,
      bidId: bid.id,
      userId,
      proposalText: proposalText || null,
      proposedAmount: proposedAmount || null,
      formData: formData || null,
      status: 'pending',
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully applied to bid',
      data: {
        id: applicationId,
        bidId: bid.id,
        userId,
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to apply for bid', error: err.message });
  }
}

// Add a bid review
export async function addBidReview(req, res) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if the bid exists
    const bidResult = await db.select().from(bidsTable).where(or(eq(bidsTable.id, id), eq(bidsTable.slug, id))).limit(1);
    if (bidResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }
    const bid = bidResult[0];

    // Create review
    const reviewId = randomUUID();
    await db.insert(bidReviewsTable).values({
      id: reviewId,
      bidId: bid.id,
      userId,
      rating: parseInt(rating, 10),
      comment,
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        id: reviewId,
        bidId: bid.id,
        userId,
        rating: parseInt(rating, 10),
        comment,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit review', error: err.message });
  }
}

// Get all reviews for a bid
export async function getBidReviews(req, res) {
  try {
    const { id } = req.params;

    // Check if the bid exists
    const bidResult = await db.select().from(bidsTable).where(or(eq(bidsTable.id, id), eq(bidsTable.slug, id))).limit(1);
    if (bidResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }
    const bid = bidResult[0];

    const reviewsResult = await db.select({
      id: bidReviewsTable.id,
      bidId: bidReviewsTable.bidId,
      rating: bidReviewsTable.rating,
      comment: bidReviewsTable.comment,
      createdAt: bidReviewsTable.createdAt,
      user: {
        id: usersTable.id,
        name: usersTable.name,
      }
    })
    .from(bidReviewsTable)
    .leftJoin(usersTable, eq(bidReviewsTable.userId, usersTable.id))
    .where(eq(bidReviewsTable.bidId, bid.id));

    return res.json({ success: true, data: reviewsResult });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews', error: err.message });
  }
}

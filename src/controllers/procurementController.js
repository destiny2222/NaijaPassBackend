import { randomUUID } from 'crypto';
import { eq, and, or, like } from 'drizzle-orm';
import db from '../db/index.js';
import { procurementsTable, kycsTable } from '../db/schema.js';

const PROCUREMENT_STATUSES = ['active', 'completed', 'suspended', 'cancelled'];

async function canManageProcurements(user) {
  if (user.role === 'admin' || user.role === 'gov') {
    return true;
  }

  return false;
}

// Get all procurements
export async function getProcurements(req, res) {
  try {
    const { lga, search, status, state } = req.query;
    
    const conditions = [];

    if (lga) {
      conditions.push(eq(procurementsTable.lga, lga));
    }
    
    if (state) {
      conditions.push(eq(procurementsTable.state, state));
    }

    if (search) {
      conditions.push(
        or(
          like(procurementsTable.contractor, `%${search}%`),
          like(procurementsTable.description, `%${search}%`)
        )
      );
    }

    if (status && PROCUREMENT_STATUSES.includes(status)) {
      conditions.push(eq(procurementsTable.status, status));
    }

    let query = db.select().from(procurementsTable);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const procurements = await query;
    return res.json({ success: true, data: procurements });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve procurements', error: err.message });
  }
}

// Get single procurement
export async function getProcurementById(req, res) {
  try {
    const { id } = req.params;
    const result = await db.select()
      .from(procurementsTable)
      .where(eq(procurementsTable.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Procurement not found' });
    }

    return res.json({ success: true, data: result[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve procurement', error: err.message });
  }
}

// Create procurement
export async function createProcurement(req, res) {
  try {
    if (!(await canManageProcurements(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: only admins or approved businesses can create procurements'
      });
    }

    const {
      lga,
      state,
      city,
      entityType,
      contractor,
      awardDate,
      amount,
      status,
      description
    } = req.body;

    const normalizedStatus = status || 'active';
    if (!PROCUREMENT_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const id = randomUUID();

    let parsedAwardDate = null;
    if (awardDate) {
      parsedAwardDate = new Date(awardDate);
      if (Number.isNaN(parsedAwardDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid awardDate' });
      }
    }

    await db.insert(procurementsTable).values({
      id,
      lga: lga || null,
      state: state || null,
      city: city || null,
      entityType: entityType || null,
      contractor: contractor || null,
      awardDate: parsedAwardDate,
      amount: amount || null,
      status: normalizedStatus,
      description: description || null,
      createdById: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Procurement created successfully',
      data: { id, lga, state, city, entityType, contractor, awardDate: parsedAwardDate, amount, status: normalizedStatus, description }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create procurement', error: err.message });
  }
}

// Update procurement
export async function updateProcurement(req, res) {
  try {
    if (!(await canManageProcurements(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: only admins or approved businesses can update procurements'
      });
    }

    const { id } = req.params;
    const {
      lga,
      state,
      city,
      entityType,
      contractor,
      awardDate,
      amount,
      status,
      description
    } = req.body;

    const existingResult = await db.select().from(procurementsTable).where(eq(procurementsTable.id, id)).limit(1);
    if (existingResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Procurement not found' });
    }

    const updateData = {};

    if (lga !== undefined) updateData.lga = lga;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (entityType !== undefined) updateData.entityType = entityType;
    if (contractor !== undefined) updateData.contractor = contractor;
    
    if (awardDate !== undefined) {
      if (awardDate === null) {
        updateData.awardDate = null;
      } else {
        const parsed = new Date(awardDate);
        if (Number.isNaN(parsed.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid awardDate' });
        }
        updateData.awardDate = parsed;
      }
    }

    if (amount !== undefined) updateData.amount = amount;
    
    if (status !== undefined) {
      if (!PROCUREMENT_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updateData.status = status;
    }

    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'At least one field is required to update' });
    }

    await db.update(procurementsTable).set(updateData).where(eq(procurementsTable.id, id));

    const updatedResult = await db.select().from(procurementsTable).where(eq(procurementsTable.id, id)).limit(1);

    return res.json({
      success: true,
      message: 'Procurement updated successfully',
      data: updatedResult[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update procurement', error: err.message });
  }
}

// Delete procurement
export async function deleteProcurement(req, res) {
  try {
    if (!(await canManageProcurements(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: only admins or approved businesses can delete procurements'
      });
    }

    const { id } = req.params;
    const existingResult = await db.select().from(procurementsTable).where(eq(procurementsTable.id, id)).limit(1);
    
    if (existingResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Procurement not found' });
    }

    await db.delete(procurementsTable).where(eq(procurementsTable.id, id));

    return res.json({ success: true, message: 'Procurement deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete procurement', error: err.message });
  }
}

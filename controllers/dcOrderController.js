const DcOrder = require('../models/DcOrder');
const DC = require('../models/DC');

const list = async (req, res) => {
  try {
    const { status, q, zone, assigned_to, lead_status, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (zone) filter.zone = zone;
    if (assigned_to) filter.assigned_to = assigned_to;
    if (lead_status) filter.lead_status = lead_status;
    if (from || to) {
      filter.createdAt = {}
      if (from) filter.createdAt.$gte = new Date(from)
      if (to) filter.createdAt.$lte = new Date(to)
    }
    if (q) {
      filter.$or = [
        { dc_code: new RegExp(q, 'i') },
        { school_name: new RegExp(q, 'i') },
        { contact_person: new RegExp(q, 'i') },
        { contact_mobile: new RegExp(q, 'i') },
        { zone: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
      ];
    }
    const items = await DcOrder.find(filter)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('updateHistory.updatedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getOne = async (req, res) => {
  try {
    const item = await DcOrder.findById(req.params.id)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('updateHistory.updatedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getHistory = async (req, res) => {
  try {
    console.log(`Fetching history for DC ${req.params.id}`);
    
    // Use lean() to get raw MongoDB document and ensure we get all data
    const item = await DcOrder.findById(req.params.id)
      .populate('updateHistory.updatedBy', 'name email')
      .lean(); // Use lean() to get plain JavaScript object
    
    if (!item) {
      console.log(`DC ${req.params.id} not found`);
      return res.status(404).json({ message: 'DC not found' });
    }
    
    // Get all history entries - ensure we're getting the raw array
    let history = item.updateHistory || [];
    
    console.log(`Raw history from DB: ${Array.isArray(history) ? history.length : 'NOT ARRAY'}`);
    console.log('History type:', typeof history);
    console.log('History is array?', Array.isArray(history));
    
    // Ensure history is an array
    if (!Array.isArray(history)) {
      console.log('History is not an array, converting...');
      if (history && typeof history === 'object') {
        // If it's an object, try to convert it
        history = Object.values(history);
      } else {
        history = [];
      }
    }
    
    // Log each entry
    if (history.length > 0) {
      console.log('History entries:');
      history.forEach((entry, idx) => {
        console.log(`  Entry ${idx + 1}:`, {
          updatedAt: entry.updatedAt,
          priority: entry.priority,
          remarks: entry.remarks?.substring(0, 30),
          followUp: entry.follow_up_date,
        });
      });
    }
    
    // If no history exists but item has data, create initial entry
    if (history.length === 0 && (item.follow_up_date || item.remarks || item.priority)) {
      console.log('No history found, creating initial entry from current data');
      history = [{
        follow_up_date: item.follow_up_date || null,
        remarks: item.remarks || 'Lead created',
        priority: item.priority || 'Cold',
        updatedAt: item.createdAt || new Date(),
        updatedBy: { name: 'System', _id: null },
      }];
    }
    
    // Sort history by date descending (newest first)
    history = history.sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || 0).getTime();
      return dateB - dateA;
    });
    
    console.log(`Returning ${history.length} history entries for DC ${req.params.id}`);
    res.json(history);
  } catch (e) {
    console.error('Get history error:', e);
    res.status(500).json({ message: e.message });
  }
};

const create = async (req, res) => {
  try {
    const payload = { ...req.body, created_by: req.user._id };
    
    // Initialize history with creation entry if follow_up_date, remarks, or priority is provided
    if (payload.follow_up_date || payload.remarks || payload.priority) {
      payload.updateHistory = [{
        follow_up_date: payload.follow_up_date ? new Date(payload.follow_up_date) : null,
        remarks: payload.remarks || '',
        priority: payload.priority || 'Cold',
        updatedBy: req.user._id,
        updatedAt: new Date(),
      }];
    }
    
    const item = await DcOrder.create(payload);
    
    // Auto-create DC entry when DcOrder (Lead/Deal) is created
    // Get products - if it's an array, take first product, otherwise use string
    let productName = 'Abacus'; // default
    if (item.products && Array.isArray(item.products) && item.products.length > 0) {
      productName = item.products[0].product_name || item.products[0].product || 'Abacus';
    } else if (typeof item.products === 'string') {
      // If products is a comma-separated string
      const products = item.products.split(',').map(p => p.trim()).filter(Boolean);
      productName = products.length > 0 ? products[0] : 'Abacus';
    }
    
    // Calculate quantity from products array or default to 1
    let quantity = 1;
    if (item.products && Array.isArray(item.products) && item.products.length > 0) {
      quantity = item.products.reduce((sum, p) => sum + (p.quantity || 1), 0);
    }
    
    // Only create DC if assigned_to exists
    if (item.assigned_to) {
      try {
        const dc = await DC.create({
          dcOrderId: item._id,
          employeeId: item.assigned_to,
          customerName: item.school_name,
          customerEmail: item.email || undefined,
          customerAddress: item.address || item.location || 'N/A',
          customerPhone: item.contact_mobile || item.contact_person || 'N/A',
          product: productName,
          requestedQuantity: quantity,
          deliverableQuantity: 0,
          status: 'created',
          createdBy: req.user._id,
        });
        console.log(`DC created successfully for DcOrder ${item._id}, assigned to employee ${item.assigned_to}`);
      } catch (dcError) {
        console.error('Error creating DC for DcOrder:', dcError);
        // Don't fail the DcOrder creation if DC creation fails, but log it
      }
    } else {
      console.warn(`DcOrder ${item._id} created without assigned_to, so no DC was created`);
    }
    
    const populated = await DcOrder.findById(item._id)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email');
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await DcOrder.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'DC not found' });
    
    // Track history if follow_up_date, remarks, or priority is being updated
    const hasFollowUpDate = req.body.follow_up_date !== undefined;
    const hasRemarks = req.body.remarks !== undefined;
    const hasPriority = req.body.priority !== undefined;
    const shouldTrackHistory = hasFollowUpDate || hasRemarks || hasPriority;
    
    // Prepare update object using $set for field updates
    const updateData = {};
    
    // Update fields using $set
    if (hasFollowUpDate) {
      updateData.follow_up_date = req.body.follow_up_date ? new Date(req.body.follow_up_date) : null;
    }
    if (hasRemarks) {
      updateData.remarks = req.body.remarks;
    }
    if (hasPriority) {
      updateData.priority = req.body.priority;
    }
    
    // Update other fields if provided
    const fieldsToUpdate = ['status', 'zone', 'location', 'contact_person', 'contact_mobile', 'school_name'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // Build the MongoDB update query
    const mongoUpdate = {};
    
    // Add $set for field updates
    if (Object.keys(updateData).length > 0) {
      mongoUpdate.$set = updateData;
    }
    
    // ALWAYS create a new history entry when follow_up_date, remarks, or priority is being updated
    // This ensures every update creates a NEW entry, not overwrites existing ones
    if (shouldTrackHistory) {
      // Get the NEW values that will be set (from request body)
      const newFollowUp = hasFollowUpDate && req.body.follow_up_date 
        ? new Date(req.body.follow_up_date) 
        : null;
      const newRemarks = hasRemarks ? (req.body.remarks || '') : '';
      const newPriority = hasPriority ? (req.body.priority || 'Cold') : 'Cold';
      
      // Create a NEW history entry with the values being set
      // This entry represents this specific update/change
      const historyEntry = {
        follow_up_date: newFollowUp,
        remarks: newRemarks,
        priority: newPriority,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      };
      
      console.log('=== CREATING NEW HISTORY ENTRY ===');
      console.log('New history entry:', JSON.stringify(historyEntry, null, 2));
      console.log('Current history count before update:', item.updateHistory?.length || 0);
      console.log('This will be entry number:', (item.updateHistory?.length || 0) + 1);
      
      // Use $push to ADD a new entry to the array
      // This preserves ALL existing history entries and adds this new one
      mongoUpdate.$push = {
        updateHistory: historyEntry
      };
      
      console.log('Using $push to append new entry. Array will have:', (item.updateHistory?.length || 0) + 1, 'entries after this update');
    }
    
    // Use findByIdAndUpdate with $set and $push to preserve all history
    const updatedItem = await DcOrder.findByIdAndUpdate(
      req.params.id,
      mongoUpdate,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'DC not found' });
    }
    
    // Fetch the updated item again to ensure we have the latest history
    const refreshedItem = await DcOrder.findById(req.params.id)
      .populate('updateHistory.updatedBy', 'name email');
    
    console.log(`=== UPDATE COMPLETE ===`);
    console.log(`DC ID: ${req.params.id}`);
    console.log(`History count BEFORE update: ${item.updateHistory?.length || 0} entries`);
    console.log(`History count AFTER update: ${refreshedItem?.updateHistory?.length || 0} entries`);
    
    if (refreshedItem?.updateHistory && refreshedItem.updateHistory.length > 0) {
      console.log('All history entries (newest first):');
      refreshedItem.updateHistory.forEach((entry, idx) => {
        const date = entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'No date';
        console.log(`  Entry ${idx + 1}: ${date} | Priority: ${entry.priority} | Remarks: "${entry.remarks?.substring(0, 30) || 'No remarks'}"`);
      });
    } else {
      console.log('WARNING: No history entries found after update!');
    }
    
    const populated = await DcOrder.findById(refreshedItem?._id || updatedItem._id)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('updateHistory.updatedBy', 'name email');
    
    res.json(populated);
  } catch (e) {
    console.error('Update error:', e);
    res.status(500).json({ message: e.message });
  }
};

const submit = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'pending' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const markInTransit = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'in_transit' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const complete = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        actual_delivery_date: req.body.actual_delivery_date || new Date(),
        pod_proof_url: req.body.pod_proof_url,
        completed_by: req.user?._id,
      },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const hold = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'hold', remarks: req.body.hold_notes || req.body.remarks },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { list, getOne, getHistory, create, update, submit, markInTransit, complete, hold };



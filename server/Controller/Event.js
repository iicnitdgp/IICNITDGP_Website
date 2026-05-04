const Event = require('../model/Event');
const EventRequest = require('../model/EventRequest');

const isAdmin = (user) => user && user.role === 'admin';

const canManageEvent = (event, user) => {
  if (!event || !user) {
    return false;
  }

  return isAdmin(user) || event.createdBy?.toString() === user._id?.toString();
};

const normalizeEventPayload = (body) => {
  const parseRequiredFields = (val) => {
    if (!val) return undefined;

    const normalizeSingle = (f) => {
      if (!f) return null;
      if (typeof f === 'string') {
        const fieldName = String(f).trim();
        const lower = fieldName.toLowerCase();
        const type = lower.includes('email') ? 'email' : lower.includes('phone') ? 'phone' : 'text';
        const label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        return { fieldName, label, type, required: true };
      }

      if (typeof f === 'object') {
        return {
          fieldName: f.fieldName || f.name || '',
          label: f.label || (f.fieldName ? (String(f.fieldName).charAt(0).toUpperCase() + String(f.fieldName).slice(1)) : ''),
          type: f.type || 'text',
          required: typeof f.required === 'boolean' ? f.required : true,
        };
      }

      return null;
    };

    if (Array.isArray(val)) {
      return val.map(normalizeSingle).filter(Boolean);
    }

    // comma separated string
    if (typeof val === 'string') {
      return String(val)
        .split(',')
        .map((s) => normalizeSingle(String(s).trim()))
        .filter(Boolean);
    }

    return undefined;
  };

  const payload = {
    name: body.name,
    description: body.description || body.details,
    details: body.details || body.description || '',
    date: body.date,
    photo: body.photo || 'https://via.placeholder.com/400x300',
    location: body.location || 'Online',
    category: body.category || 'other',
    registrationRequired: body.registrationRequired ?? true,
    participationType: body.participationType || 'single',
    maxTeamSize: body.maxTeamSize ? parseInt(body.maxTeamSize, 10) : null,
    requiredParticipantFields: parseRequiredFields(body.requiredParticipantFields),
    rules: body.rules || '',
    maxParticipants: body.maxParticipants ? parseInt(body.maxParticipants, 10) : null,
    registrationDeadline: body.registrationDeadline || null,
    contactEmail: body.contactEmail || null,
    contactPhone: body.contactPhone || null,
    status: body.status || 'draft',
  };

  return payload;
};

const generateRegistrationLink = (eventId) => {
  return `${process.env.CLIENT_BASE_URL}/event/registration/${eventId}`;
};

const createEvent = async (req, res) => {
  try {
    console.debug('createEvent payload.rules (raw):', req.body && req.body.rules);
    const payload = normalizeEventPayload(req.body);

    if (!payload.name || !payload.description || !payload.date) {
      return res.status(400).json({ message: 'Name, description, and date are required' });
    }

    if (payload.participationType === 'team' && !payload.maxTeamSize) {
      return res.status(400).json({ message: 'maxTeamSize is required for team events' });
    }

    const createData = {
      ...payload,
      createdBy: req.user._id,
    };

    if (payload.requiredParticipantFields) {
      createData.requiredParticipantFields = payload.requiredParticipantFields;
    }

    const event = await Event.create(createData);

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const { status, createdBy } = req.query;
    const query = {};
    const requesterId = req.user?._id?.toString();
    const requesterIsAdmin = isAdmin(req.user);

    if (!req.user) {
      query.status = 'active';
    } else if (requesterIsAdmin) {
      if (status) {
        query.status = status;
      }
      if (createdBy) {
        query.createdBy = createdBy;
      }
    } else {
      query.status = 'active';
      if (createdBy && createdBy === requesterId) {
        query.createdBy = requesterId;
      }
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1, createdAt: -1 });

    const eventsWithLinks = events.map((event) => {
      if (event.status === 'active') {
        return {
          ...event.toObject(),
          registrationLink: generateRegistrationLink(event._id),
        };
      }
      return event;
    });

    res.status(200).json(eventsWithLinks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'active' && !canManageEvent(event, req.user)) {
      return res.status(403).json({ message: 'Event is not publicly available' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!canManageEvent(event, req.user)) {
      return res.status(403).json({ message: 'You are not allowed to update this event' });
    }

    console.debug('updateEvent incoming rules (raw):', req.body && req.body.rules);
    const payload = normalizeEventPayload(req.body);
    
    // For partial updates (like status changes), preserve existing values if not provided
    const updateData = {};
    Object.keys(payload).forEach((key) => {
      if (req.body[key] !== undefined) {
        updateData[key] = payload[key];
      } else if (key === 'requiredParticipantFields' && payload[key]) {
        updateData[key] = payload[key];
      } else if (key !== 'name' && key !== 'description' && key !== 'date') {
        // For optional fields, only update if provided
        if (payload[key] !== null && payload[key] !== undefined) {
          updateData[key] = payload[key];
        }
      }
    });

    // Always preserve these critical fields if not explicitly provided
    if (req.body.name === undefined) updateData.name = event.name;
    if (req.body.description === undefined) updateData.description = event.description;
    if (req.body.date === undefined) updateData.date = event.date;
    if (req.body.participationType === undefined) updateData.participationType = event.participationType;
    if (req.body.maxTeamSize === undefined) updateData.maxTeamSize = event.maxTeamSize;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const closeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!canManageEvent(event, req.user)) {
      return res.status(403).json({ message: 'You are not allowed to close this event' });
    }

    event.status = 'closed';
    await event.save();

    res.status(200).json({
      message: 'Event closed successfully',
      event,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!canManageEvent(event, req.user)) {
      return res.status(403).json({ message: 'You are not allowed to view registrations for this event' });
    }

    const registrations = await EventRequest.find({ eventId: req.params.id })
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  closeEvent,
  getEventRegistrations,
};
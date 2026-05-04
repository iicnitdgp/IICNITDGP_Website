const Event = require('../model/Event');
const EventRequest = require('../model/EventRequest');
const sendEmail = require('../utils/mail');

const isAdmin = (user) => user && user.role === 'admin';

const normalizeEmails = (participants = []) => participants.map((participant) => String(participant.email || '').trim().toLowerCase());

const submitRegistration = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'active') {
      return res.status(400).json({ message: 'Registrations are not open for this event' });
    }

    const { type, teamName = '', participants = [] } = req.body;

    if (!type || !['single', 'team'].includes(type)) {
      return res.status(400).json({ message: 'Registration type must be single or team' });
    }

    if (type !== event.participationType) {
      return res.status(400).json({ message: `This event only accepts ${event.participationType} registrations` });
    }

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    if (type === 'single' && participants.length !== 1) {
      return res.status(400).json({ message: 'Single registrations must contain exactly one participant' });
    }

    if (type === 'team') {
      if (!teamName.trim()) {
        return res.status(400).json({ message: 'teamName is required for team registrations' });
      }

      if (event.maxTeamSize && participants.length > event.maxTeamSize) {
        return res.status(400).json({ message: `Team size cannot exceed ${event.maxTeamSize}` });
      }
    }

    const participantEmails = normalizeEmails(participants);
    const duplicateRegistration = await EventRequest.findOne({
      eventId,
      status: { $in: ['pending', 'approved'] },
      'participants.email': { $in: participantEmails },
    });

    if (duplicateRegistration) {
      return res.status(400).json({ message: 'A participant from this team is already registered for this event' });
    }

    const registration = await EventRequest.create({
      eventId,
      type,
      teamName: type === 'team' ? teamName : '',
      participants,
      submittedBy: req.user ? req.user._id : null,
      status: 'pending',
    });

    // Send email to team leader (first participant) about registration submission
    if (participants.length > 0) {
      const teamLeaderEmail = participants[0].email;
      const teamLeaderName = participants[0].name;
      const registrationType = type === 'team' ? `Team - ${teamName}` : 'Individual';
      
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Submitted</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2c3e50;">Registration Submitted Successfully</h2>
            
            <p>Hi <strong>${teamLeaderName}</strong>,</p>
            
            <p>Your ${registrationType} registration for <strong>${event.name}</strong> has been submitted successfully.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <h3 style="margin-top: 0;">Registration Details:</h3>
              <p><strong>Event:</strong> ${event.name}</p>
              <p><strong>Type:</strong> ${registrationType}</p>
              <p><strong>Status:</strong> <span style="color: #FF9800;">Pending Approval</span></p>
              <p><strong>Submitted on:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Our team will review your registration and get back to you shortly. You will receive an email notification once your registration is approved.</p>
            
            <p>If you have any questions, please contact us.</p>
            
            <p>Best regards,<br/><strong>IIC NIT Durgapur Team</strong></p>
          </div>
        </body>
        </html>
      `;
      
      await sendEmail(teamLeaderEmail, `Registration Submitted - ${event.name}`, emailContent);
    }

    res.status(201).json({
      message: 'Registration request submitted successfully',
      registration,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getRegistrationById = async (req, res) => {
  try {
    const registration = await EventRequest.findById(req.params.id)
      .populate('eventId')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = registration.eventId;
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const ownerId = event.createdBy?._id?.toString() || event.createdBy?.toString();
    const requesterId = req.user?._id?.toString();

    if (!isAdmin(req.user) && ownerId !== requesterId && registration.submittedBy?._id?.toString() !== requesterId) {
      return res.status(403).json({ message: 'You are not allowed to view this registration' });
    }

    res.status(200).json(registration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const approveRegistration = async (req, res) => {
  try {
    const registration = await EventRequest.findById(req.params.id).populate('eventId');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only admins can approve registrations' });
    }

    registration.status = 'approved';
    registration.reviewedBy = req.user._id;
    registration.approvedAt = new Date();
    registration.rejectionReason = '';
    await registration.save();

    const event = await Event.findById(registration.eventId._id);
    if (event && event.status !== 'active') {
      event.status = 'active';
      event.approvedAt = new Date();
      event.approvedBy = req.user._id;
      await event.save();
    }

    // Send approval email to team leader (first participant)
    if (registration.participants && registration.participants.length > 0) {
      const teamLeaderEmail = registration.participants[0].email;
      const teamLeaderName = registration.participants[0].name;
      const registrationType = registration.type === 'team' ? `Team - ${registration.teamName}` : 'Individual';
      const eventName = event ? event.name : 'Your Event';
      
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2c3e50;">🎉 Registration Approved!</h2>
            
            <p>Hi <strong>${teamLeaderName}</strong>,</p>
            
            <p>Great news! Your ${registrationType} registration for <strong>${eventName}</strong> has been <strong style="color: #4CAF50;">APPROVED</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
              <h3 style="margin-top: 0;">Registration Details:</h3>
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Type:</strong> ${registrationType}</p>
              <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">✓ Approved</span></p>
              <p><strong>Approved on:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>You are all set! Please make sure to attend the event on the scheduled date and time.</p>
            
            <p>If you have any questions, please contact us.</p>
            
            <p>Best regards,<br/><strong>IIC NIT Durgapur Team</strong></p>
          </div>
        </body>
        </html>
      `;
      
      await sendEmail(teamLeaderEmail, `Registration Approved - ${eventName}`, emailContent);
    }

    res.status(200).json({
      message: 'Registration approved successfully',
      registration,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const registration = await EventRequest.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: 'Only admins can reject registrations' });
    }

    registration.status = 'rejected';
    registration.reviewedBy = req.user._id;
    registration.rejectionReason = req.body.rejectionReason || 'Rejected by admin';
    registration.approvedAt = null;
    await registration.save();

    res.status(200).json({
      message: 'Registration rejected successfully',
      registration,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getEventPublicRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'active') {
      return res.status(400).json({ message: 'Approved registrations are not public until the event is active' });
    }

    const registrations = await EventRequest.find({ eventId: req.params.eventId, status: 'approved' })
      .select('teamName participants approvedAt type')
      .sort({ approvedAt: -1, createdAt: -1 });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  submitRegistration,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  getEventPublicRegistrations,
};
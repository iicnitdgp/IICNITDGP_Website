#!/usr/bin/env node
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const Event = require('../model/Event');
const EventRequest = require('../model/EventRequest');

async function main() {
  const eventId = process.argv[2];
  if (!eventId) {
    console.error('Usage: node backfillRegistrationFields.js <eventId>');
    process.exit(1);
  }

  await connectDB();

  try {
    const event = await Event.findById(eventId).lean();
    if (!event) {
      console.error('Event not found for id:', eventId);
      process.exit(1);
    }

    const fieldNames = (event.requiredParticipantFields || []).map((f) => f.fieldName).filter(Boolean);
    if (fieldNames.length === 0) {
      console.log('No requiredParticipantFields found for event. Nothing to backfill.');
      process.exit(0);
    }

    console.log('Backfilling fields for event:', eventId);
    console.log('Fields to ensure on each participant:', fieldNames.join(', '));

    const registrations = await EventRequest.find({ eventId });
    console.log('Found', registrations.length, 'registrations');

    let updatedCount = 0;

    for (const reg of registrations) {
      let changed = false;
      if (Array.isArray(reg.participants)) {
        for (let i = 0; i < reg.participants.length; i++) {
          const participant = reg.participants[i] || {};
          for (const fname of fieldNames) {
            if (!(fname in participant)) {
              participant[fname] = '';
              changed = true;
            }
          }
          reg.participants[i] = participant;
        }
      }

      if (changed) {
        await reg.save();
        updatedCount++;
        console.log('Updated registration:', reg._id.toString());
      }
    }

    console.log('Backfill complete. Registrations updated:', updatedCount);
    process.exit(0);
  } catch (err) {
    console.error('Error during backfill:', err);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
  }
}

main();

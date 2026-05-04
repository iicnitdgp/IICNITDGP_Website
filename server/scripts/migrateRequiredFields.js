/*
  Run this script from the `server` folder to migrate existing Event documents
  where `requiredParticipantFields` are stored as strings to the new structured format.

  Usage:
    node scripts/migrateRequiredFields.js

  Make sure your environment (MONGO_URI or connection setup) matches the server's.
*/

const mongoose = require('mongoose');
const Event = require('../model/Event');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iicn';

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

async function migrate() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO_URI);

  const events = await Event.find({});
  let changed = 0;

  for (const ev of events) {
    const current = ev.requiredParticipantFields;
    // If current is empty or already structured (object with fieldName), skip
    if (!current) continue;
    if (Array.isArray(current) && current.length > 0 && typeof current[0] === 'object' && current[0].fieldName) continue;

    // If it's a single string stored, try to parse JSON or comma list
    let arr = [];
    if (Array.isArray(current)) arr = current;
    else if (typeof current === 'string') {
      try {
        const parsed = JSON.parse(current);
        if (Array.isArray(parsed)) arr = parsed;
        else arr = String(current).split(',').map((s) => s.trim()).filter(Boolean);
      } catch (e) {
        arr = String(current).split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const normalized = arr.map(normalizeSingle).filter(Boolean);
    if (normalized.length > 0) {
      ev.requiredParticipantFields = normalized;
      await ev.save();
      changed += 1;
      console.log('Migrated event', ev._id.toString());
    }
  }

  console.log(`Migration complete. ${changed} events updated.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});

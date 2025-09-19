const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  mentor: { type: String, required: true },
  mentee: { type: String, required: true },
  topic: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'completed', 'missed'], default: 'upcoming' },
  link: { type: String, required: true }
});

module.exports = mongoose.model('Meeting', meetingSchema);

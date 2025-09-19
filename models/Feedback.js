const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  mentor_rating: Number,
  website_rating: Number,
  overall_rating: Number,
  feedback_text: String,
  submitted_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Feedback", feedbackSchema);

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const path = require("path");
require('dotenv').config();
const User = require("./models/User");
const Meeting = require("./models/Meeting");
const Progress = require("./models/Progress");
const Feedback = require("./models/Feedback");


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mentor_portal", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// Middleware
app.use(express.json());
const cors = require("cors");
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend files

// -------------------- LOGIN + AUTO SIGNUP --------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    let user = await User.findOne({ email, role });

// Edit academic item
app.patch("/api/progress/:email/academic/:id", async (req, res) => {
  try {
    const { email, id } = { email: req.params.email, id: req.params.id };
    const updateFields = {};
    ["subject","marks","totalMarks","percentage","semester","year"].forEach(k=>{
      if (req.body[k] !== undefined) updateFields[`academicProgress.$.${k}`] = req.body[k];
    });
    const progress = await Progress.findOneAndUpdate(
      { userEmail: email, "academicProgress._id": id },
      { $set: updateFields, $currentDate: { lastUpdated: true } },
      { new: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error editing academic item" });
  }
});

// Delete academic item
app.delete("/api/progress/:email/academic/:id", async (req, res) => {
  try {
    const progress = await Progress.findOneAndUpdate(
      { userEmail: req.params.email },
      { $pull: { academicProgress: { _id: req.params.id } }, $currentDate: { lastUpdated: true } },
      { new: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting academic item" });
  }
});

// Edit personal item
app.patch("/api/progress/:email/personal/:id", async (req, res) => {
  try {
    const { email, id } = { email: req.params.email, id: req.params.id };
    const updateFields = {};
    ["goal","status","description"].forEach(k=>{
      if (req.body[k] !== undefined) updateFields[`personalDevelopment.$.${k}`] = req.body[k];
    });
    const progress = await Progress.findOneAndUpdate(
      { userEmail: email, "personalDevelopment._id": id },
      { $set: updateFields, $currentDate: { lastUpdated: true } },
      { new: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error editing personal item" });
  }
});

// Delete personal item
app.delete("/api/progress/:email/personal/:id", async (req, res) => {
  try {
    const progress = await Progress.findOneAndUpdate(
      { userEmail: req.params.email },
      { $pull: { personalDevelopment: { _id: req.params.id } }, $currentDate: { lastUpdated: true } },
      { new: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting personal item" });
  }
});

// Set the 5-semester series at once
app.put("/api/progress/:email/semester-series", async (req, res) => {
  try {
    const { series } = req.body; // [{semester, score}] (expect length 5)
    if (!Array.isArray(series) || series.length === 0) {
      return res.status(400).json({ success: false, message: "series array required" });
    }
    const progress = await Progress.findOneAndUpdate(
      { userEmail: req.params.email },
      { semesterSeries: series, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating semester series" });
  }
});

// Upsert a single month of events participated
app.post("/api/progress/:email/events", async (req, res) => {
  try {
    const { month, year, events } = req.body;
    if (!month || !year || events == null) {
      return res.status(400).json({ success: false, message: "month, year, events required" });
    }
    // Remove existing month-year then push the new one
    let progress = await Progress.findOneAndUpdate(
      { userEmail: req.params.email },
      { $pull: { eventsParticipatedMonthly: { month, year } } },
      { new: true, upsert: true }
    );
    progress = await Progress.findOneAndUpdate(
      { userEmail: req.params.email },
      { $push: { eventsParticipatedMonthly: { month, year, events } }, $currentDate: { lastUpdated: true } },
      { new: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating events participated" });
  }
});
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const name = email.split("@")[0];
      user = new User({ name, email, role, password: hashedPassword });
      await user.save();
      return res.json({ success: true, message: `Account created successfully as ${role}` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password. Try again." });
    }

    res.json({ 
      success: true, 
      message: `Login successful! Welcome ${user.name}`,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        id: user._id
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

// -------------------- SIGNUP --------------------
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, role, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: "Account created successfully!" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

// -------------------- FORGOT PASSWORD --------------------
// NOTE: For demo purposes only. In production, send a reset link via email instead of returning the password.
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: "Email and role are required" });
    }
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const tempPassword = Math.random().toString(36).slice(-8); // simple 8-char password
    const hashed = await bcrypt.hash(tempPassword, 10);
    user.password = hashed;
    await user.save();
    // In real app, email this temp password or a reset link to the user
    return res.json({ success: true, message: "Temporary password generated", tempPassword });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

app.get("/api/meetings", async (req, res) => {
  const { role, name } = req.query;
  if (!role || !name) {
    return res.status(400).json({ success: false, message: "Missing role or name" });
  }

  const query = role === "mentor" ? { mentor: name } : { mentee: name };
  try {
    const meetings = await Meeting.find(query).sort({ date: 1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching meetings" });
  }
});
app.post("/api/meetings", async (req, res) => {
  const { mentor, mentee, topic, date, link } = req.body;
  if (!mentor || !mentee || !topic || !date || !link) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  try {
    const meeting = new Meeting({ mentor, mentee, topic, date, link });
    await meeting.save();
    res.json({ success: true, message: "Meeting scheduled!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error scheduling meeting" });
  }
});

// -------------------- USER PROFILE ENDPOINTS --------------------
app.get("/api/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching user profile" });
  }
});

app.put("/api/user/:email", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      req.body,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

// -------------------- PROGRESS ENDPOINTS --------------------
app.get("/api/progress/:email", async (req, res) => {
  try {
    const progress = await Progress.findOne({ userEmail: req.params.email });
    if (!progress) {
      // Create default progress if none exists
      const defaultProgress = new Progress({
        userEmail: req.params.email,
        academicProgress: [
          { subject: "IWP", marks: 48, totalMarks: 50, percentage: 96, semester: "V", year: "2024" },
          { subject: "CC", marks: 35, totalMarks: 50, percentage: 82, semester: "V", year: "2024" }
        ],
        personalDevelopment: [
          { goal: "Attend Resume Workshop", status: "completed", description: "Complete resume building workshop" },
          { goal: "Join a club in our college", status: "in_progress", description: "Participate in college activities" },
          { goal: "Do Daily Coding Challenge without fail", status: "pending", description: "Maintain coding practice" }
        ],
        monthlyActivity: [
          { month: "Jan", year: 2024, score: 40 },
          { month: "Feb", year: 2024, score: 30 },
          { month: "Mar", year: 2024, score: 45 },
          { month: "Apr", year: 2024, score: 50 },
          { month: "May", year: 2024, score: 60 },
          { month: "Jun", year: 2024, score: 55 },
          { month: "Jul", year: 2024, score: 10 },
          { month: "Aug", year: 2024, score: 15 },
          { month: "Sep", year: 2024, score: 65 },
          { month: "Oct", year: 2024, score: 70 },
          { month: "Nov", year: 2024, score: 75 },
          { month: "Dec", year: 2024, score: 80 }
        ],
        // Exactly five semesters for dashboard
        semesterSeries: [
          { semester: "Sem I", score: 72 },
          { semester: "Sem II", score: 78 },
          { semester: "Sem III", score: 81 },
          { semester: "Sem IV", score: 86 },
          { semester: "Sem V", score: 90 }
        ],
        // Dedicated monthly events participated
        eventsParticipatedMonthly: [
          { month: "Jan", year: 2024, events: 1 },
          { month: "Feb", year: 2024, events: 0 },
          { month: "Mar", year: 2024, events: 2 },
          { month: "Apr", year: 2024, events: 1 },
          { month: "May", year: 2024, events: 3 },
          { month: "Jun", year: 2024, events: 2 },
          { month: "Jul", year: 2024, events: 0 },
          { month: "Aug", year: 2024, events: 1 },
          { month: "Sep", year: 2024, events: 2 },
          { month: "Oct", year: 2024, events: 1 },
          { month: "Nov", year: 2024, events: 1 },
          { month: "Dec", year: 2024, events: 3 }
        ],
        yearlyProgress: [
          { year: "VII", overallScore: 70 },
          { year: "VIII", overallScore: 80 },
          { year: "IX", overallScore: 85 },
          { year: "X", overallScore: 90 }
        ],
        attendanceRate: 73,
        communicationRate: 48
      });
      await defaultProgress.save();
      return res.json({ success: true, progress: defaultProgress });
    }
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching progress" });
  }
});

app.put("/api/progress/:email", async (req, res) => {
  try {
    const progress = await Progress.findOneAndUpdate(
      { userEmail: req.params.email },
      { ...req.body, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: "Progress updated successfully", progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating progress" });
  }
});

// Add academic entry: { subject, marks, totalMarks, percentage, semester, year }
app.post("/api/progress/:email/academic", async (req, res) => {
  try {
    const { subject, marks, totalMarks, percentage, semester, year } = req.body;
    if (!subject || marks == null || !totalMarks || percentage == null) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const progress = await Progress.findOneAndUpdate(
      { userEmail: req.params.email },
      {
        $push: { academicProgress: { subject, marks, totalMarks, percentage, semester, year } },
        $set: { lastUpdated: new Date() }
      },
      { new: true, upsert: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding academic progress" });
  }
});

// Add personal development diary item: { goal, status, description }
app.post("/api/progress/:email/personal", async (req, res) => {
  try {
    const { goal, status, description } = req.body;
    if (!goal) return res.status(400).json({ success: false, message: "Goal required" });
    const progress = await Progress.findOneAndUpdate(
      { userEmail: req.params.email },
      {
        $push: { personalDevelopment: { goal, status: status || 'completed', description } },
        $set: { lastUpdated: new Date() }
      },
      { new: true, upsert: true }
    );
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error adding personal development item" });
  }
});

// -------------------- FEEDBACK ENDPOINTS --------------------
app.post("/api/feedback", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.json({ success: true, message: "Feedback submitted successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error submitting feedback" });
  }
});

app.get("/api/feedback", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ submitted_at: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching feedback" });
  }
});

// -------------------- MENTEE-MENTOR RELATIONSHIP --------------------
app.get("/api/mentees/:mentorEmail", async (req, res) => {
  try {
    const mentorEmail = req.params.mentorEmail;
    const mentorUser = await User.findOne({ email: mentorEmail, role: "mentor" });
    const mentorName = mentorUser ? mentorUser.name : undefined;

    const mentees = await User.find({
      role: "mentee",
      $or: [
        { mentor: mentorEmail }, // if stored as email
        ...(mentorName ? [{ mentor: mentorName }] : []) // if stored as name
      ]
    });
    res.json({ success: true, mentees });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching mentees" });
  }
});

app.get("/api/mentor/:menteeEmail", async (req, res) => {
  try {
    const mentee = await User.findOne({ email: req.params.menteeEmail });
    if (!mentee || !mentee.mentor) {
      return res.status(404).json({ success: false, message: "Mentor not assigned" });
    }
    const mentor = await User.findOne({ email: mentee.mentor });
    res.json({ success: true, mentor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching mentor" });
  }
});


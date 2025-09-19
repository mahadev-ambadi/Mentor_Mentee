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

// -------------------- 404 Handler --------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
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
    const mentees = await User.find({ 
      role: "mentee", 
      mentor: req.params.mentorEmail 
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


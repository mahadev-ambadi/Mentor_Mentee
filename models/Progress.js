const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    
    // Academic Progress
    academicProgress: [{
        subject: { type: String, required: true },
        marks: { type: Number, required: true },
        totalMarks: { type: Number, required: true },
        percentage: { type: Number, required: true },
        semester: { type: String },
        year: { type: String }
    }],
    
    // Personal Development Goals
    personalDevelopment: [{
        goal: { type: String, required: true },
        status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
        description: { type: String },
        completedDate: { type: Date }
    }],
    
    // Activity Tracking (for charts)
    monthlyActivity: [{
        month: { type: String, required: true },
        year: { type: Number, required: true },
        score: { type: Number, required: true }
    }],
    
    // Attendance & Communication
    attendanceRate: { type: Number, default: 0 },
    communicationRate: { type: Number, default: 0 },
    
    // Overall Progress Over Years
    yearlyProgress: [{
        year: { type: String, required: true },
        overallScore: { type: Number, required: true }
    }],

    // Exactly 5 semesters series to display on dashboard
    semesterSeries: [{
        semester: { type: String, required: true }, // e.g., 'Sem I', 'Sem II'
        score: { type: Number, required: true }
    }],

    // Dedicated store: events participated per month
    eventsParticipatedMonthly: [{
        month: { type: String, required: true }, // Jan, Feb, ...
        year: { type: Number, required: true },
        events: { type: Number, required: true }
    }],
    
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', progressSchema);

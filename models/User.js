const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'mentor', 'mentee'], required: true },
    password: { type: String, required: true },
    
    // Profile Information
    employeeId: { type: String },
    rollNumber: { type: String }, // For mentees
    department: { type: String },
    class: { type: String }, // For mentees
    bloodGroup: { type: String }, // For mentees
    age: { type: Number }, // For mentees
    address: { type: String },
    contactNo: { type: String },
    profileImage: { type: String, default: 'https://via.placeholder.com/150' },
    
    // Professional Details (for mentors)
    jobTitle: { type: String },
    almaMatter: { type: String },
    areasOfExpertise: [{ type: String }],
    mentoringExperience: { type: String },
    availableTimings: { type: String },
    linkedinProfile: { type: String },
    researchPapers: [{ title: String, url: String }],
    clubsMemberOf: [{ type: String }],
    aboutMe: { type: String },
    
    // Mentee-specific fields
    mentor: { type: String }, // Mentor's name
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

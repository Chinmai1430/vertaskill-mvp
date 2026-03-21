const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Required to allow your frontend to talk to this backend
require('dotenv').config();

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors()); // This allows requests from any origin (like your local frontend)

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas (Cloud)!'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- DATA SCHEMA & MODEL ---
const waitlistSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    registeredAt: { type: Date, default: Date.now }
});

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

// --- ROUTES ---

// 1. Home Route (Fixes the "Cannot GET /" error)
app.get('/', (req, res) => {
    res.send('🚀 VertaSkill API is live and running successfully!');
});

// 2. Waitlist Registration Route
app.post('/api/waitlist', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if email already exists
        const existingUser = await Waitlist.findOne({ email });
        if (existingUser) {
            // Find position (count of users registered before or with this user)
            const position = await Waitlist.countDocuments({ registeredAt: { $lte: existingUser.registeredAt } });
            return res.status(409).json({ message: 'Email already registered', position });
        }

        // Create new registration
        const newUser = new Waitlist({ email });
        await newUser.save();

        // Get total count for waitlist position
        const totalCount = await Waitlist.countDocuments();
        
        res.status(201).json({ 
            message: 'Successfully added to waitlist', 
            position: totalCount 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- SERVER START ---
// Use Render's dynamic port or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Secure Production Server running on port ${PORT}`);
});
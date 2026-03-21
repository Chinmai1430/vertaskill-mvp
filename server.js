const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); // Allows your frontend to talk to this backend
app.use(express.json()); // Allows the server to read JSON data sent from your form
app.use(express.static(__dirname)); // Serves your index.html, styles.css, and app.js automatically

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas (Cloud)!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- DATA MODEL ---
const waitlistSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now }
});
const Waitlist = mongoose.model('Waitlist', waitlistSchema);

// --- ROUTES ---

// 1. Home Route: Serves your actual website (UI)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Success Check Route (Optional for debugging)
app.get('/status', (req, res) => {
    res.send('🚀 VertaSkill API is live and running successfully!');
});

// 3. Waitlist Registration Route
app.post('/api/waitlist', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Create and save new user
        const newUser = new Waitlist({ email });
        await newUser.save();

        // Get total count for waitlist position
        const totalCount = await Waitlist.countDocuments();

        res.status(201).json({
            message: 'Successfully added to waitlist',
            position: totalCount
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This email is already on the waitlist!' });
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- SERVER START ---
// Use Render's dynamic port or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
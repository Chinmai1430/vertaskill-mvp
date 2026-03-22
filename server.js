const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.static(__dirname)); 

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

// 1. Home Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Waitlist Registration Route
app.post('/api/waitlist', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Save new user to MongoDB
        const newUser = new Waitlist({ email });
        await newUser.save();

        // Get total count for the waitlist position
        const totalCount = await Waitlist.countDocuments();

        // --- BYPASS FIREWALL: EMAILJS REST API ---
        const emailData = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
                to_email: email,
                position: totalCount
            }
        };

        try {
            const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });

            if (emailResponse.ok) {
                console.log("✅ EmailJS: Welcome email sent successfully to " + email);
            } else {
                const errorText = await emailResponse.text();
                console.error("❌ EmailJS API Error:", errorText);
            }
        } catch (emailError) {
            console.error("❌ EmailJS Connection Error:", emailError);
        }
        // ------------------------------------------

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
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
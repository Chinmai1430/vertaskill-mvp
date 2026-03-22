const nodemailer = require('nodemailer');
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

        // --- AUTOMATED WELCOME EMAIL ---
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS  
            }
        });

        const mailOptions = {
            from: `"VertaSkill" <${process.env.EMAIL_USER}>`,
            to: email, // Sends directly to the user who just signed up
            subject: 'Access Granted: Welcome to the VertaSkill Waitlist 🚀',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; border-radius: 10px; background-color: #0f172a; color: #cbd5e1;">
                    <h2 style="color: #38bdf8; text-align: center; margin-bottom: 20px;">VertaSkill</h2>
                    <p style="font-size: 16px;">Hey there,</p>
                    <p style="font-size: 16px;">You are officially on the list. You are currently <strong>#${totalCount}</strong> in line.</p>
                    <p style="font-size: 16px; line-height: 1.6;">We are building the global standard for peer-to-peer skill trading. No more wasting hours explaining your codebase on Zoom.</p>
                    <p style="font-size: 16px;">We will notify you the exact second your beta access opens up.</p>
                    <hr style="border-color: #334155; margin: 30px 0;">
                    <p style="font-size: 14px; color: #94a3b8; text-align: center;">Keep building,<br><strong>The VertaSkill Team</strong></p>
                </div>
            `
        };

        // Send the email silently in the background
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Email error: ", error);
            } else {
                console.log("✅ Welcome email sent to: " + email);
            }
        });
        // --------------------------------

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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
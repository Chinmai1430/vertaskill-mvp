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
            to: email, 
            subject: 'Welcome to VertaSkill | Your Waitlist Status',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #1e293b; border-radius: 8px; background-color: #0f172a; color: #cbd5e1;">
                    <h2 style="color: #38bdf8; border-bottom: 1px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; font-weight: 600; letter-spacing: 0.5px;">VertaSkill</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; color: #f8fafc;">Hello,</p>
                    
                    <p style="font-size: 16px; line-height: 1.6;">Welcome to the VertaSkill network. Your spot is officially secured, and you are currently <strong>#${totalCount}</strong> on our early access waitlist.</p>
                    
                    <p style="font-size: 16px; line-height: 1.6;">We are building the global standard for peer-to-peer technical collaboration. Our zero-fiat ecosystem allows developers and founders to trade engineering output for the specialized help they need, backed by AI-driven context sharing and secure, real-time execution environments.</p>
                    
                    <p style="font-size: 16px; line-height: 1.6;">We are currently rolling out beta access in batches to ensure network stability. We will notify you directly at this email address the moment your workspace is ready to be initialized.</p>
                    
                    <br>
                    <p style="font-size: 16px; line-height: 1.6; color: #f8fafc;">Keep building,<br><strong>The VertaSkill Team</strong></p>
                    
                    <hr style="border-top: 1px solid #1e293b; margin: 30px 0;">
                    <p style="font-size: 12px; color: #475569; text-align: center;">You are receiving this email because you registered for the VertaSkill waitlist. If you have any questions, simply reply to this email.</p>
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
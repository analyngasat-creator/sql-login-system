const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection Configuration (Handles both Local and Cloud Environments)
const dbConfig = process.env.DATABASE_URL 
    ? { uri: process.env.DATABASE_URL } // Cloud deployment database connection string
    : {
        host: 'localhost',
        user: 'root',
        password: '', 
        database: 'auth_db'
      };

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10
});

// Route: Register Endpoint with Validation Rules
app.post('/api/register', async (expressReq, expressRes) => {
    try {
        const { username, email, password } = expressReq.body;

        if (!username || !email || !password) {
            return expressRes.status(400).json({ message: 'All fields are required.' });
        }

        // Rule Validation: Username check (Alphanumeric, length >= 3)
        const usernameRegex = /^[a-zA-Z0-9]{3,}$/;
        if (!usernameRegex.test(username)) {
            return expressRes.status(400).json({ message: 'Username must be at least 3 characters and contain alphanumeric characters only.' });
        }

        // Rule Validation: Email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return expressRes.status(400).json({ message: 'Please enter a valid email address.' });
        }

        // Rule Validation: Password strength check (Min 8 characters, 1 upper, 1 lower, 1 digit)
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return expressRes.status(400).json({ message: 'Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
        await pool.execute(sql, [username, email, passwordHash]);

        return expressRes.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        console.error("Registration Error Details:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return expressRes.status(400).json({ message: 'Username or Email already exists.' });
        }
        return expressRes.status(500).json({ message: 'Server error processing request.' });
    }
});

// Route: Login Endpoint
app.post('/api/login', async (expressReq, expressRes) => {
    try {
        const { identifier, password } = expressReq.body;

        if (!identifier || !password) {
            return expressRes.status(400).json({ message: 'All fields are required.' });
        }

        const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
        const [rows] = await pool.execute(sql, [identifier, identifier]);

        if (rows.length === 0) {
            return expressRes.status(401).json({ message: 'Invalid credentials.' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return expressRes.status(401).json({ message: 'Invalid credentials.' });
        }

        // Returns both the success message and username back to the dashboard frontend
        return expressRes.json({ 
            message: `Welcome back, ${user.username}!`, 
            username: user.username 
        });
    } catch (error) {
        console.error("Login Error Details:", error);
        return expressRes.status(500).json({ message: 'Server error processing authentication.' });
    }
});

// Automatically verify and create missing tables on startup
async function initializeDatabase() {
    try {
        console.log("Checking database table structures...");
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableSql);
        console.log("Table structures verified successfully!");
    } catch (err) {
        console.error("Failed to automatically build required database tables:", err.message);
    }
}

// Run database initialization
initializeDatabase();

// EXPORT THE APP: Crucial requirement for Vercel Serverless Functions
module.exports = app;

// Keep the local fallback listener ONLY if we are running locally
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
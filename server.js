const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors'); // Install this if you haven't: npm install cors

const app = express();
app.use(express.json());

// Enable CORS so your Vercel frontend can safely communicate with this Railway backend
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Fallback to all origins if not set yet
    credentials: true
}));

app.use(express.static(path.join(__dirname, 'public')));

// Database Connection Configuration (Handles Local and Railway Environments)
const dbConfig = process.env.DATABASE_URL 
    ? { uri: process.env.DATABASE_URL } 
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

// Route: Register Endpoint
app.post('/api/register', async (expressReq, expressRes) => {
    try {
        const { username, email, password } = expressReq.body;

        if (!username || !email || !password) {
            return expressRes.status(400).json({ message: 'All fields are required.' });
        }

        const usernameRegex = /^[a-zA-Z0-9]{3,}$/;
        if (!usernameRegex.test(username)) {
            return expressRes.status(400).json({ message: 'Username must be at least 3 characters and contain alphanumeric characters only.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return expressRes.status(400).json({ message: 'Please enter a valid email address.' });
        }

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
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to automatically build required database tables:", err.message);
    }
}

initializeDatabase();
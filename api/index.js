const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); // Swapped to pure JS version to prevent serverless binary crashes
const cors = require('cors');

const app = express();
app.use(express.json());

// Enable CORS so your Vercel frontend can safely communicate with this backend
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    credentials: true
}));

// Dynamic runtime configuration switch for SQL vulnerability testing
let isSqlVulnerableMode = false;

// Database Connection Configuration (Handles Local and Serverless Environments)
const dbConfig = process.env.DATABASE_URL 
    ? { uri: process.env.DATABASE_URL } 
    : {
        host: 'localhost',
        user: 'root',
        password: '', 
        database: 'auth_db'
      };

// Serverless optimization: configuration adjustments for pooling inside ephemeral environments
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 1, // Minimize connections since serverless scales horizontally per request
    queueLimit: 0,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined // Enable SSL automatically for secure cloud DB configurations
});

// Helper function to sleep (to guarantee parallel transaction overlaps)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Middleware to automatically verify and create missing tables on the first dynamic request
let dbInitialized = false;
async function initializeDatabaseMiddleware(req, res, next) {
    if (dbInitialized) {
        return next();
    }
    try {
        console.log("Validating database structures on demand...");
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
        console.log("Database tables validated successfully!");
        dbInitialized = true;
        next();
    } catch (err) {
        console.error("Database initialization failed:", err.message);
        next(); // Fall through to let the endpoints return structured connection errors
    }
}

// Inject DB schema validation check into all API calls
app.use('/api', initializeDatabaseMiddleware);

// Route: Toggle Vulnerability Mode State
app.post('/api/toggle-vulnerability', (expressReq, expressRes) => {
    const { enabled } = expressReq.body;
    if (typeof enabled !== 'boolean') {
        return expressRes.status(400).json({ message: 'Invalid payload state configuration.' });
    }
    isSqlVulnerableMode = enabled;
    return expressRes.json({ 
        message: `SQL Injection security controls are now ${isSqlVulnerableMode ? 'DISABLED (System Vulnerable)' : 'ENABLED (System Secure)'}.`,
        vulnerable: isSqlVulnerableMode
    });
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

// Route: Login Endpoint (Supports injection simulation via dynamic concatenation routing)
app.post('/api/login', async (expressReq, expressRes) => {
    try {
        const { identifier, password } = expressReq.body;

        if (!identifier || !password) {
            return expressRes.status(400).json({ message: 'All fields are required.' });
        }

        if (isSqlVulnerableMode) {
            // VULNERABLE PATHWAY: Unsanitized raw dynamic string concatenation maps straight into evaluation
            const unsafeSql = `SELECT * FROM users WHERE username = '${identifier}' OR email = '${identifier}'`;
            console.log(`[VULNERABLE TRIGGER] Executing SQL: ${unsafeSql}`);
            
            const [rows] = await pool.query(unsafeSql);

            if (rows.length === 0) {
                return expressRes.status(401).json({ message: 'Invalid credentials.' });
            }

            const user = rows[0];
            return expressRes.json({ 
                message: `[VULNERABLE MECHANISM MATCH] SQLi successful! Bypassed auth verification parameters.`, 
                username: user.username,
                queryExecuted: unsafeSql
            });
            
        } else {
            // SECURE PATHWAY: Strong query parameterization blocks logical syntax injection vectors
            const safeSql = 'SELECT * FROM users WHERE username = ? OR email = ?';
            const [rows] = await pool.execute(safeSql, [identifier, identifier]);

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
        }
    } catch (error) {
        console.error("Login Error Details:", error);
        return expressRes.status(500).json({ 
            message: 'Database structural failure execution loop exception.',
            error: error.message 
        });
    }
});

// Route: Simulate Database Transaction Deadlock / Lock Contention
app.post('/api/simulate-deadlock', async (expressReq, expressRes) => {
    console.log("[DEADLOCK SIMULATOR] Initiating parallel write lock sequence...");

    try {
        const [users] = await pool.query('SELECT id FROM users LIMIT 2');
        if (users.length < 2) {
            return expressRes.status(400).json({ 
                message: 'Deadlock simulation aborted: Your database must contain at least 2 users.' 
            });
        }
        
        const firstUserId = users[0].id;
        const secondUserId = users[1].id;

        // Transaction A: Locks Record 1 -> Waits -> Attempts to lock Record 2
        const runTransactionA = async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                console.log("[Tx A] Started. Row lock step 1: Row A...");
                
                await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [firstUserId]);
                console.log(`[Tx A] Locked Row ID: ${firstUserId}`);

                await sleep(500); 

                console.log(`[Tx A] Row lock step 2: Requesting Row B (ID: ${secondUserId})...`);
                await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [secondUserId]);
                
                await connection.commit();
                console.log("[Tx A] Completed successfully.");
                return { tx: 'A', success: true };
            } catch (err) {
                await connection.rollback();
                console.error("[Tx A] Failed gracefully:", err.message);
                return { tx: 'A', success: false, error: err.message, code: err.code };
            } finally {
                connection.release();
            }
        };

        // Transaction B: Locks Record 2 -> Waits -> Attempts to lock Record 1
        const runTransactionB = async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                console.log("[Tx B] Started. Row lock step 1: Row B...");
                
                await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [secondUserId]);
                console.log(`[Tx B] Locked Row ID: ${secondUserId}`);

                await sleep(500); 

                console.log(`[Tx B] Row lock step 2: Requesting Row A (ID: ${firstUserId})...`);
                await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [firstUserId]);
                
                await connection.commit();
                console.log("[Tx B] Completed successfully.");
                return { tx: 'B', success: true };
            } catch (err) {
                await connection.rollback();
                console.error("[Tx B] Failed gracefully:", err.message);
                return { tx: 'B', success: false, error: err.message, code: err.code };
            } finally {
                connection.release();
            }
        };

        const results = await Promise.all([
            runTransactionA(),
            runTransactionB()
        ]);

        const failure = results.find(r => !r.success);

        if (failure) {
            return expressRes.json({
                message: "Deadlock simulated successfully!",
                systemStatus: "STABLE (No server crash)",
                errorCaught: {
                    transaction: failure.tx,
                    code: failure.code,
                    details: failure.error
                }
            });
        }

        return expressRes.json({
            message: "Simulation finished, but write conflicts resolved sequentially.",
            results
        });

    } catch (error) {
        console.error("Deadlock System Level Error:", error);
        return expressRes.status(500).json({ 
            message: 'Server error trying to configure deadlock parameters.', 
            error: error.message 
        });
    }
});

// Fallback for running locally without Vercel Serverless environment:
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Local server listening on port ${PORT}`);
    });
}

// Export Express Application Instance for Vercel
module.exports = app;
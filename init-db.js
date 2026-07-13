const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
    console.log("Attempting to connect to local MySQL server...");
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '' 
    });
    
    console.log("Successfully connected to MySQL server!");
    console.log("Reading setup.sql file...");
    
    const sql = fs.readFileSync('setup.sql', 'utf8');
    const statements = sql.split(';');
    
    for (let statement of statements) {
        if (statement.trim()) {
            // Using .query instead of .execute fixes the unsupported prepared statement protocol error
            await connection.query(statement);
        }
    }
    
    console.log("Database and tables created successfully!");
    await connection.end();
}

run().catch(err => {
    console.error("\n[ERROR] Database connection failed!");
    console.error("==========================================");
    console.error(err);
    console.error("==========================================");
});
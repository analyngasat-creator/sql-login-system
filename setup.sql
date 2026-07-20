-- Remove old table if it exists
DROP TABLE IF EXISTS bug_logs;

-- Create the new BugSafari logging structure
CREATE TABLE bug_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,         -- e.g., 'Runtime Errors'
    error_message TEXT NOT NULL,    -- The specific error detected
    page_url TEXT NOT NULL,         -- The page where the bug occurred
    status TEXT DEFAULT 'DETECTED', -- 'DETECTED', 'FIXED'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optional: You can insert a test log if you want to verify the table
INSERT INTO bug_logs (category, error_message, page_url) VALUES 
('Runtime Errors', 'Test detection: Null property access', '/pages/runtime-errors.html');
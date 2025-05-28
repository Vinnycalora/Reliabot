// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Connect to the existing SQLite DB
const dbPath = path.resolve(__dirname, '../reminders.db');
const db = new sqlite3.Database(dbPath);

// Get all tasks
app.get('/api/tasks', (req, res) => {
    db.all('SELECT * FROM reminders', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Add new task
app.post('/api/tasks', (req, res) => {
    const { user_id, task, remind_time } = req.body;

    console.log('Received POST /api/tasks body:', req.body);

    const query = `
        INSERT INTO reminders (user_id, task, remind_time)
        VALUES (?, ?, ?)
    `;

    db.run(query, [user_id, task, remind_time], function (err) {
        if (err) {
            console.error('❌ DB Insert Error:', err.message);
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            id: this.lastID,
            user_id,
            task,
            remind_time,
            completed: 0, // Assuming the `reminders` table doesn't have this field yet
            created_at: new Date().toISOString(),
            completed_at: null,
        });
    });
});




app.get('/', (req, res) => {
    res.send('Reliabot backend is running.');
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'Bot is online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});


app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

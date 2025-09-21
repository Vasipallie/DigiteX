//inits
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { Console, time } from 'console';
import dotenv from 'dotenv'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware data stuff, important for app to run
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));

app.use(express.json());                        
app.use(bodyParser.urlencoded({ extended: true })); 

app.route('/').get((req, res) => {
    res.render('index');
});

app.route('/login').get((req, res) => {
    res.render('login', { error: null });
});

app.route('/authorportal').get((req, res) => {
    res.render('authorportal', { name: 'James Don'});
});

app.route('/New').get((req, res) => {
    res.render('blogwrite');
});

app.post('/submit-article', (req, res) => {
    try {
        console.log('Received article:', req.body);
        
        if (!req.body) {
            return res.status(400).json({ 
                success: false, 
                message: 'No data received' 
            });
        }
        const { title, html, department, timestamp, wordCount } = req.body;
        
        console.log('Parsed data:', {
            title,
            department,
            wordCount,
            timestamp,
            htmlLength: html ? html.length : 0
        });
        if (!title || !html || !department) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: title, content, or department' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Article submitted successfully',
            data: {
                title,
                department,
                wordCount,
                timestamp
            }
        });
        
    } catch (error) {
        console.error('Error processing article submission:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

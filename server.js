//inits
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { time } from 'console';
import dotenv from 'dotenv'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// Middleware data stuff, important for app to run
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.urlencoded({ extended: true }));

app.route('/').get((req, res) => {
    res.render('index');
})
app.route('/login').get((req, res) => {
    res.render('login', { error: null });
})
//work ON POST REQUEST


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
    
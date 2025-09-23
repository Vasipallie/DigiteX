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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const supalink = process.env.SUPALINK ;
const supakey = process.env.SUPAKEY ;


// Supabase setup
//WARNING - DO NOT PUBLISH Api Keys VIA GITHUB OR ANY PUBLIC REPOSITORY
const supabase = createClient(supalink, supakey); 


// Middleware data stuff, important for app to run
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use(cookieParser()); // Add cookie parser middleware
app.use(express.json());                        
app.use(bodyParser.urlencoded({ extended: true })); 

app.route('/').get((req, res) => {
    res.render('index');
});

app.route('/login').get((req, res) => {
    res.render('login', { error: null });
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    //supabase builtin auth
    supabase.auth.signInWithPassword({
        email: username,
        password: password
  }) .then(({ data, error }) => {
        if (error) {
            console.error('Login error:', error);
            return res.status(401).render('login', { error: 'Invalid username or password' });
        }
        //create session cookie for 2 days
        res.cookie('session', data.session, { maxAge: 2 * 24 * 60 * 60 * 1000 }); // 2 days
        res.redirect('/authorportal');
    });
});
//change the name here to display programatically
app.route('/authorportal').get(async (req, res) => {
    try {
        //get name from users database
        const session = req.cookies.session;
        
        if (!session) {
            return res.status(401).redirect('/login');
        }
        
        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        
        if (!user) {
            return res.status(401).redirect('/login');
        }
        console.log('Fetching user data for UID:'+user.id);
        const { data: userData, error } = await supabase
            .from('Users')
            .select('name')
            .eq('id', user.id)
            .single();
            console.log('User data fetched:', userData);

        if (error) {
            console.error('Error fetching user data:', error);
            return res.status(500).redirect('/login');
        }

        res.render('authorportal', { name: userData?.name || 'User' });
    } catch (error) {
        console.error('Error in authorportal route:', error);
        res.status(500).redirect('/login');
    }
});

app.route('/New').get((req, res) => {
    res.render('blogwrite');
});

app.post('/submit-article', async (req, res) => {
    try {
        console.log('Received article:', req.body);
        
        if (!req.body) {
            return res.status(400).json({ 
                success: false, 
                message: 'No data received' 
            });
        }
        const { title, html, department, timestamp, wordCount } = req.body;
        let { data, error } = await supabase
            .from('Articles')
            .insert([
                {
                    title,
                    html: html,
                    department,

                }
            ]);
            console.log('Supabase insert response:', { data, error });
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
            message: 'Article submitted successfully'
        });
        
    } catch (error) {
        console.error('Error processing article submission:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.route('/article/:id').get(async (req, res) => {
    try {
        const { id } = req.params;
        const { data: articles, error } = await supabase
            .from('Articles')
            .select('*')
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).render('blogdisplay', { 
                content: '<p>Error loading article</p>',
                title: 'Error',
                dept: 'SYSTEM'
            });
        }
        
        if (!articles || articles.length === 0) {
            return res.status(404).render('blogdisplay', { 
                content: '<p>Article not found</p>',
                title: 'Not Found',
                dept: 'SYSTEM'
            });
        }
        
        const article = articles[0];
        console.log('Article data:', article);
        // calculate word count and read time
        article.word_count = article.html.split(' ').length;
        article.read_time = Math.max(1, Math.ceil(article.word_count / 150));
        res.render('blogdisplay', { 
            content: article.html ,
            title: article.title ,
            dept: article.department,
            read: article.read_time
        });
        
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).render('blogdisplay', { 
            content: '<p>Server error occurred</p>',
            title: 'Error',
            dept: 'SYSTEM'
        });
    }
});

app.route('/blog').get(async (req, res) => {
    let { data: Articles, error } = await supabase
        .from('Articles')
        .select('*')
        .order('id', { ascending: false });
    if (error) {
        console.error('Supabase error:', error);
        return res.status(500).send('Error loading articles');
    }
    console.log('Fetched articles:', Articles);
    //good article display html
    //clean the html content and shorten it to 200 characters for excerpt, and calculate read time based on word count
    Articles.forEach(article => {
        article.word_count = article.html.split(' ').length;
        article.read_time = Math.max(1, Math.ceil(article.word_count / 150)); 
        article.excerpt = article.html.replace(/<[^>]+>/g, '').substring(0, 200) + '... Read More';
        article.html = ''; 
        article.bloghtml = `<article class="article" onclick="location.href='/article/${article.id}'" data-category="${article.department.toLowerCase()}">
                <div class="article-category">${article.department}</div>
                <h2 class="article-title">${article.title}</h2>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <span class="article-date">${new Date(article.timestamp).toLocaleDateString()}</span>
                    <span class="article-read-time">${article.read_time} min read</span>
                </div>
            </article>`;
    });

    res.render('blog', { articles: Articles.map(article => article.bloghtml).join('') });
});
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

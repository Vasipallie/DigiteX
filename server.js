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
import multer from 'multer'; 

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const supalink = process.env.SUPALINK ;
const supakey = process.env.SUPAKEY ;


// Supabase setup
//WARNING - DO NOT PUBLISH Api Keys VIA GITHUB OR ANY PUBLIC REPOSITORY
const supabase = createClient(supalink, supakey); 

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Check if it's an image file
        if (file && file.mimetype && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});


// Middleware data stuff, important for app to run
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files
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
            .select('*')
            .eq('id', user.id)
            .single();
            console.log('User data fetched:', userData);

        if (error) {
            console.error('Error fetching user data:', error);
            return res.status(500).redirect('/login');
        }

        console.log(userData.dept)
        var articles, articlesError;
        if (userData.dept === 'SUDO') {
            console.log('User is SUDO, fetching all articles');
            var { data: articles, error: articlesError } = await supabase
                .from('Articles')
                .select('*')
                .order('id', { ascending: false });
        }else{
         var { data: articles, error: articlesError } = await supabase
            .from('Articles')
            .select('*')
            .in('department', [userData.dept, 'General'])
            .order('id', { ascending: false });
        }
        console.log('Articles fetched for department:', userData.dept, articles);
        if (articlesError) {
            console.error('Error fetching articles:', articlesError);
            return res.status(500).render('authorportal', { 
                name: userData?.name || 'User',
                articles: '<p>Error loading articles</p>'
            });
        }

        let articlesHTML = '';
        if (articles && articles.length > 0) {
            articles.forEach(article => {
                // Replace <br> and </p> tags with two spaces before removing all HTML tags
                let excerptText = article.html.replace(/<br\s*\/?>/gi, '  ').replace(/<\/p>/gi, '  ');
                const excerpt = excerptText.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
                const wordCount = article.html.split(' ').length;
                const readTime = Math.max(1, Math.ceil(wordCount / 150));
                console.log(`Article ${article.id}: Visible = "${article.Visible}" (type: ${typeof article.Visible})`);
                
                let isVisible = false;
                if (article.Visible === 'TRUE' || 
                    article.Visible === 'true' || 
                    article.Visible === true || 
                    article.Visible === 1 || 
                    article.Visible === '1') {
                    isVisible = true;
                } else if (article.Visible === null || article.Visible === undefined) {
                    isVisible = false;
                }
                
                console.log(`Article ${article.id}: isVisible = ${isVisible}`);
                
                articlesHTML += `
                <div class="article-card" data-id="${article.id}">
                    <div class="article-header">
                        <span class="article-status ${isVisible ? 'visible' : 'hidden'}">${isVisible ? 'PUBLISHED' : 'DRAFT'}</span>
                        <div class="article-actions">
                            <button class="edit-btn" onclick="editArticle(${article.id})">Edit</button>
                            <button class="toggle-btn ${isVisible ? 'unpublish-btn' : 'publish-btn'}" onclick="toggleVisibility(${article.id}, ${isVisible})">
                                ${isVisible ? 'Unpublish' : 'Publish'}
                            </button>
                            <button class="delete-btn" onclick="deleteArticle(${article.id})">Delete</button>
                        </div>
                    </div>
                    <h3 class="article-title">${article.title}</h3>
                    <p class="article-excerpt">${excerpt}</p>
                    <div class="article-meta">
                        <span class="article-date">${new Date(article.timestamp).toLocaleDateString()}</span>
                        <span class="article-read-time">${readTime} min read</span>
                        <a href="/article/${article.id}" class="view-link" target="_blank">View Article</a>
                    </div>
                </div>`;
            });
        } else {
            articlesHTML = '<div class="no-articles"><p>No articles found for your department.</p><a href="/New" class="create-first-btn">Create your first article</a></div>';
        }

        res.render('authorportal', { 
            name: userData?.name || 'User',
            articles: articlesHTML
        });
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
        //get author
        const session = req.cookies.session;
        if (!session) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }
        //get name from users database
        const { data: userData, errori } = await supabase
            .from('Users')
            .select('*')
            .eq('id', user.id)
            .single();
        const author = userData.name;
        console.log('User data fetched for article submission:', userData);

        const { title, html, department } = req.body;
        let { data, error } = await supabase
            .from('Articles')
            .insert([
                {
                    title,
                    html: html,
                    department,
                    Author:author,
                    Visible: 'FALSE'
                }
            ]);
            console.log('Supabase insert response:', { data, error });
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
        .eq('Visible','TRUE')
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
        let excerptText = article.html.replace(/<br\s*\/?>/gi, '  ').replace(/<\/p>/gi, '  ');
        article.excerpt = excerptText.replace(/<[^>]+>/g, '').substring(0, 200) + '... Read More';
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

// Toggle article visibility
app.post('/toggle-visibility/:id', async (req, res) => {
    try {
        const session = req.cookies.session;
        if (!session) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }

        const { id } = req.params;
        const { visible } = req.body;

        console.log(`Toggle visibility for article ${id}: visible = ${visible} (type: ${typeof visible})`);

        const newVisibleValue = visible ? 'TRUE' : 'FALSE';
        console.log(`Setting Visible to: ${newVisibleValue}`);

        const { data, error } = await supabase
            .from('Articles')
            .update({ Visible: newVisibleValue })
            .eq('id', id);

        if (error) {
            console.error('Error toggling visibility:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        console.log('Visibility update successful:', data);
        res.json({ success: true, message: 'Visibility updated successfully' });
    } catch (error) {
        console.error('Error in toggle visibility:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete article
app.delete('/delete-article/:id', async (req, res) => {
    try {
        const session = req.cookies.session;
        if (!session) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }

        const { id } = req.params;

        const { data, error } = await supabase
            .from('Articles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting article:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.json({ success: true, message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error in delete article:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
app.route('/contact').get((req, res) => {
    res.render('contact');
});

app.get('/edit-article/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: articles, error } = await supabase
            .from('Articles')
            .select('*')
            .eq('id', id);

        if (error || !articles || articles.length === 0) {
            return res.status(404).send('Article not found');
        }

        const article = articles[0];
        res.render('blogedit', { article });
    } catch (error) {
        console.error('Error loading article for edit:', error);
        res.status(500).send('Internal server error');
    }
});

app.put('/update-article/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, html, department } = req.body;
        //get author from users database
        const session = req.cookies.session;
        if (!session) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }
        const { data: userData, errori } = await supabase
            .from('Users')
            .select('*')
            .eq('id', user.id)
            .single();
        const author = userData.name;
        console.log('User data fetched for article update:', userData);


        if (!title || !html || !department) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        const { data, error } = await supabase
            .from('Articles')
            .update({ 
                title, 
                html, 
                department,
                Author: author
            })
            .eq('id', id);

        if (error) {
            console.error('Update error:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to update article' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Article updated successfully',
            redirectUrl: `/article/${id}`
        });
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});
app.route('/about').get((req, res) => {
    res.render('about');
}
);

// Upload page
app.get('/upload', (req, res) => {
    res.render('upload');
});

// Image upload route (public - no auth required)
app.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        // Generate the full image URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

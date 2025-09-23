# DigiteX Blog Platform

A modern, full-stack blog platform built with Node.js, Express, and Supabase. DigiteX provides an elegant interface for creating, managing, and displaying technology articles with a focus on AI, Business, and Medicine.

![DigiteX Platform](./views/logo.png)

## 🚀 Features

### Frontend
- **Modern UI/UX**: Dark theme with elegant navigation and responsive design
- **Rich Text Editor**: Summernote WYSIWYG editor for content creation
- **Article Display**: Professional blog layout with syntax highlighting
- **Category Filtering**: Filter articles by department (AI, Business, Medicine)
- **Mobile Responsive**: Optimized for all device sizes

### Backend
- **Express.js Server**: RESTful API with proper error handling
- **Supabase Integration**: PostgreSQL database with real-time capabilities
- **Authentication**: Secure login system with session management
- **Content Management**: Full CRUD operations for articles
- **Real-time Features**: Live article submission and display

### Content Features
- **Syntax Highlighting**: Enhanced code block display
- **Table Support**: Styled tables for data presentation
- **Blockquotes**: Elegant quote formatting
- **Image Support**: Responsive image handling
- **Reading Time**: Automatic calculation based on word count

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Frontend**: EJS templating, Vanilla JavaScript
- **Styling**: Custom CSS with modern design patterns
- **Authentication**: Supabase Auth
- **Editor**: Summernote WYSIWYG
- **Environment**: Environment variables with dotenv

## 📁 Project Structure

```
DigiteX/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not tracked)
└── views/                 # EJS templates and static assets
    ├── index.ejs          # Homepage
    ├── login.ejs          # Authentication page
    ├── authorportal.ejs   # Author dashboard
    ├── blogwrite.ejs      # Article creation interface
    ├── blogdisplay.ejs    # Individual article view
    ├── blog.ejs           # Articles listing page
    ├── logo.png           # Platform logo
    ├── bg.jpg             # Background images
    ├── login.jpg          # Login page background
    └── digifont.ttf       # Custom font
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vasipallie/DigiteX.git
   cd DigiteX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   SUPALINK=your_supabase_url
   SUPAKEY=your_supabase_anon_key
   ```

4. **Database Setup**
   Create the following tables in your Supabase database:

   **Users Table:**
   ```sql
   CREATE TABLE Users (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     name TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

   **Articles Table:**
   ```sql
   CREATE TABLE Articles (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     html TEXT NOT NULL,
     department TEXT NOT NULL,
     timestamp TIMESTAMP DEFAULT NOW(),
     author_id UUID REFERENCES Users(id)
   );
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   node server.js
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📊 Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| name | TEXT | User's display name |
| created_at | TIMESTAMP | Account creation time |

### Articles Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | TEXT | Article title |
| html | TEXT | Article content (HTML) |
| department | TEXT | Category (AI, Business, Medicine) |
| timestamp | TIMESTAMP | Publication time |
| author_id | UUID | Foreign key to Users |

## 🎨 Design Features

### Color Scheme
- **Primary**: Dark theme (#000000)
- **Accent**: Teal/Blue gradients (#28829e, #4971ed)
- **Text**: White/Light gray hierarchy
- **Borders**: Subtle gray tones (#333, #444)

### Typography
- **Headers**: Custom DigiteX font
- **Body**: Be Vietnam Pro
- **Code**: Courier New monospace

### Components
- **Sidebar Navigation**: Modern left sidebar with icons
- **Article Cards**: Hover effects and smooth transitions
- **Rich Editor**: Full-featured Summernote integration
- **Responsive Tables**: Styled data presentation

## 🔧 API Endpoints

### Public Routes
- `GET /` - Homepage
- `GET /blog` - Articles listing
- `GET /article/:id` - Individual article view
- `GET /login` - Authentication page

### Protected Routes
- `GET /authorportal` - Author dashboard
- `GET /New` - Article creation page
- `POST /submit-article` - Create new article
- `POST /login` - User authentication

## 📝 Usage

### Creating Articles
1. Navigate to `/login` and authenticate
2. Access the author portal at `/authorportal`
3. Click "New Post" to open the editor
4. Use the Summernote editor for rich content
5. Select department and add title
6. Submit article for publication

### Content Features
- **Bold/Italic**: Standard formatting options
- **Headers**: H1-H6 support with custom styling
- **Lists**: Ordered and unordered lists
- **Code Blocks**: Syntax highlighting with `<pre>` tags
- **Tables**: Responsive table formatting
- **Blockquotes**: Elegant quote styling
- **Images**: Upload and embed support

## 🔒 Security Features

- **Session Management**: Secure cookie-based sessions
- **Authentication**: Supabase Auth integration
- **Input Validation**: Server-side validation
- **XSS Prevention**: HTML sanitization
- **CORS Protection**: Configured headers

## 🚀 Deployment

### Environment Setup
```env
NODE_ENV=production
SUPALINK=your_production_supabase_url
SUPAKEY=your_production_supabase_key
PORT=3000
```

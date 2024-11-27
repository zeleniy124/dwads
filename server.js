// server.js

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors'); // Correct CORS package for Express

const app = express();
const PORT = 3000;

// Middleware Setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session Setup
app.use(cors());

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use(
    session({
        secret: 'your-secret-key', // Replace with a secure key
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

// Helper Functions
const getThreads = () => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'threads.json'), 'utf-8');
        if (!data.trim()) {
            return [];
        }
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading or parsing threads.json:', err);
        return [];
    }
};

const saveThreads = (threads) => {
    try {
        fs.writeFileSync(
            path.join(__dirname, 'data', 'threads.json'),
            JSON.stringify(threads, null, 2),
            'utf-8'
        );
    } catch (err) {
        console.error('Error writing to threads.json:', err);
    }
};

// Routes

// Home Route - Display All Threads
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API to Get All Threads with Summary Information
app.get('/api/threads', (req, res) => {
    const threads = getThreads();

    // Map threads to include summary details
    const threadsSummary = threads.map(thread => {
        const numberOfPosts = thread.posts.length;
        const numberOfComments = thread.posts.reduce((acc, post) => acc + post.comments.length, 0);

        return {
            id: thread.id,
            title: thread.title,
            content: thread.content,
            author: thread.author,
            createdAt: thread.createdAt,
            numberOfPosts,
            numberOfComments
        };
    });

    res.json(threadsSummary);
});

// API to Create a New Thread
app.post('/api/threads', (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
    }

    const threads = getThreads();
    const newThread = {
        id: uuidv4(),
        title,
        content,
        author: req.session.id,
        createdAt: new Date(),
        posts: [],
    };
    threads.push(newThread);
    saveThreads(threads);
    res.status(201).json(newThread);
});

// API to Get a Specific Thread
app.get('/api/threads/:id', (req, res) => {
    const threads = getThreads();
    const thread = threads.find(t => t.id === req.params.id);
    if (!thread) {
        return res.status(404).json({ message: 'Thread not found.' });
    }
    res.json(thread);
});

// API to Add a Post to a Thread
app.post('/api/threads/:id/posts', (req, res) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ message: 'Content is required.' });
    }

    const threads = getThreads();
    const thread = threads.find(t => t.id === req.params.id);
    if (!thread) {
        return res.status(404).json({ message: 'Thread not found.' });
    }

    const newPost = {
        id: uuidv4(),
        content,
        author: req.session.id,
        createdAt: new Date(),
        comments: [],
    };

    thread.posts.push(newPost);
    saveThreads(threads);
    res.status(201).json(newPost);
});

// API to Add a Comment to a Post
app.post('/api/threads/:threadId/posts/:postId/comments', (req, res) => {
    const { content } = req.body;
    const { threadId, postId } = req.params;

    if (!content) {
        return res.status(400).json({ message: 'Content is required.' });
    }

    const threads = getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (!thread) {
        return res.status(404).json({ message: 'Thread not found.' });
    }

    const post = thread.posts.find(p => p.id === postId);
    if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
    }

    const newComment = {
        id: uuidv4(),
        content,
        author: req.session.id,
        createdAt: new Date(),
    };

    post.comments.push(newComment);
    saveThreads(threads);
    res.status(201).json(newComment);
});

// Serve Frontend Pages
app.get('/threads/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'thread.html'));
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

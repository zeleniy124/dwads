// public/js/scripts.js

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we're on
    if (window.location.pathname === '/') {
        loadThreads();
        setupThreadForm();
    } else if (window.location.pathname.startsWith('/threads/')) {
        const threadId = window.location.pathname.split('/threads/')[1];
        loadThreadDetails(threadId);
        setupPostForm(threadId);
    }
});

// Load all threads on the homepage
function loadThreads() {
    fetch('/api/threads')
        .then(response => response.json())
        .then(threads => {
            const threadContainer = document.getElementById('thread-container');
            threadContainer.innerHTML = '';

            if (threads.length === 0) {
                threadContainer.innerHTML = '<p>No threads available. Be the first to create one!</p>';
                return;
            }

            threads.forEach(thread => {
                const card = document.createElement('div');
                card.classList.add('thread-card');

                const title = document.createElement('h3');
                title.textContent = thread.title;
                card.appendChild(title);

                const description = document.createElement('p');
                description.textContent = thread.content.length > 100 ? thread.content.substring(0, 100) + '...' : thread.content;
                card.appendChild(description);

                const details = document.createElement('p');
                const createdAt = new Date(thread.createdAt).toLocaleString();
                details.innerHTML = `
                    <strong>Author:</strong> ${thread.author} <br>
                    <strong>Created At:</strong> ${createdAt} <br>
                    <strong>Posts:</strong> ${thread.numberOfPosts} <br>
                    <strong>Comments:</strong> ${thread.numberOfComments}
                `;
                card.appendChild(details);

                const viewButton = document.createElement('a');
                viewButton.href = `/threads/${thread.id}`;
                viewButton.textContent = 'View Thread';
                viewButton.classList.add('view-button');
                card.appendChild(viewButton);

                threadContainer.appendChild(card);
            });
        })
        .catch(err => console.error('Error loading threads:', err));
}

// Setup form to create a new thread
function setupThreadForm() {
    const form = document.getElementById('thread-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value.trim();
        const content = document.getElementById('content').value.trim();

        fetch('/api/threads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        })
            .then(response => response.json())
            .then(thread => {
                window.location.href = `/threads/${thread.id}`;
            })
            .catch(err => console.error('Error creating thread:', err));
    });
}

// Load thread details and posts
function loadThreadDetails(threadId) {
    fetch(`/api/threads/${threadId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Thread not found');
            }
            return response.json();
        })
        .then(thread => {
            document.getElementById('thread-title').textContent = thread.title;
            document.getElementById('thread-content').textContent = thread.content;
            document.getElementById('thread-author').textContent = thread.author;
            document.getElementById('thread-createdAt').textContent = new Date(thread.createdAt).toLocaleString();

            const postList = document.getElementById('post-list');
            postList.innerHTML = '';
            thread.posts.forEach(post => {
                const li = document.createElement('li');
                li.classList.add('post-item');

                // Post Content
                const postContent = document.createElement('p');
                postContent.textContent = post.content;
                li.appendChild(postContent);

                // Post Author and Date
                const postInfo = document.createElement('p');
                postInfo.innerHTML = `<strong>Author (Session ID):</strong> ${post.author} <br> <strong>Posted At:</strong> ${new Date(post.createdAt).toLocaleString()}`;
                li.appendChild(postInfo);

                // Comments Section
                const commentsSection = document.createElement('div');
                commentsSection.classList.add('comments-section');

                const commentsHeader = document.createElement('h4');
                commentsHeader.textContent = 'Comments';
                commentsSection.appendChild(commentsHeader);

                const commentsList = document.createElement('ul');
                commentsList.classList.add('comments-list');
                post.comments.forEach(comment => {
                    const commentLi = document.createElement('li');
                    commentLi.classList.add('comment-item');

                    const commentContent = document.createElement('p');
                    commentContent.textContent = comment.content;
                    commentLi.appendChild(commentContent);

                    const commentInfo = document.createElement('p');
                    commentInfo.innerHTML = `<strong>Author (Session ID):</strong> ${comment.author} <br> <strong>Posted At:</strong> ${new Date(comment.createdAt).toLocaleString()}`;
                    commentLi.appendChild(commentInfo);

                    commentsList.appendChild(commentLi);
                });
                commentsSection.appendChild(commentsList);

                // Add Comment Form
                const addCommentForm = document.createElement('form');
                addCommentForm.classList.add('add-comment-form');
                addCommentForm.innerHTML = `
                    <textarea class="comment-content" placeholder="Your Comment" required></textarea><br>
                    <button type="submit">Add Comment</button>
                `;
                addCommentForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const commentContent = addCommentForm.querySelector('.comment-content').value.trim();
                    if (!commentContent) return;

                    addComment(threadId, post.id, commentContent, () => {
                        loadThreadDetails(threadId); // Refresh comments
                    });
                });
                commentsSection.appendChild(addCommentForm);

                li.appendChild(commentsSection);
                postList.appendChild(li);
            });
        })
        .catch(err => {
            console.error(err);
            alert('Thread not found.');
            window.location.href = '/';
        });
}

// Setup form to add a new post
function setupPostForm(threadId) {
    const form = document.getElementById('post-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = document.getElementById('post-content').value.trim();

        fetch(`/api/threads/${threadId}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        })
            .then(response => response.json())
            .then(post => {
                loadThreadDetails(threadId); // Refresh posts
                form.reset();
            })
            .catch(err => console.error('Error adding post:', err));
    });
}

// Function to add a comment to a post
function addComment(threadId, postId, content, callback) {
    fetch(`/api/threads/${threadId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
    })
        .then(response => response.json())
        .then(comment => {
            if (callback) callback();
        })
        .catch(err => console.error('Error adding comment:', err));
}

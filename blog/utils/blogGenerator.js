const fs = require('fs-extra');
const path = require('path');
const { generateBlogPost } = require('./openai');
const { searchImages, downloadImages } = require('./images');
const { generateHtml } = require('./seo');
const dotenv = require('dotenv');
const winston = require('winston');
const slug = require('slug');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(__dirname, '../logs/blog-generator.log') })
  ]
});

/**
 * Generate a complete blog post from keyword to HTML
 * @param {string} keyword - The keyword to generate content for
 * @returns {Object} Generated blog post data
 */
async function generateCompleteBlogPost(keyword) {
  try {
    logger.info(`Starting blog generation process for keyword: ${keyword}`);
    
    // Step 1: Generate blog content using OpenAI
    logger.info('Generating blog content...');
    const blogData = await generateBlogPost(keyword);
    
    // Clean up the slug
    blogData.slug = slug(blogData.title.toLowerCase());
    
    // Step 2: Fetch relevant images
    logger.info('Fetching images...');
    const images = await searchImages(blogData.imageKeywords[0], 2);
    
    // Step 3: Download images
    logger.info('Downloading images...');
    blogData.images = await downloadImages(images, blogData.slug);
    
    // Step 4: Generate HTML
    logger.info('Generating HTML...');
    blogData.html = generateHtml(blogData);
    
    // Step 5: Save blog post
    logger.info('Saving blog post...');
    await saveBlogPost(blogData);
    
    logger.info(`Blog post generation complete: ${blogData.title}`);
    return blogData;
  } catch (error) {
    logger.error(`Error generating blog post: ${error.message}`);
    throw error;
  }
}

/**
 * Save blog post to filesystem
 * @param {Object} blogData - The blog post data
 * @returns {Promise} - Resolves when blog post is saved
 */
async function saveBlogPost(blogData) {
  // Ensure directories exist
  const contentDir = path.join(__dirname, '../content');
  const postsDir = path.join(contentDir, 'posts');
  const htmlDir = path.join(__dirname, '../public/articles');
  
  await fs.ensureDir(contentDir);
  await fs.ensureDir(postsDir);
  await fs.ensureDir(htmlDir);
  
  // Save raw blog data as JSON
  const postDataPath = path.join(postsDir, `${blogData.slug}.json`);
  await fs.writeFile(postDataPath, JSON.stringify(blogData, null, 2));
  
  // Save HTML version
  const htmlPath = path.join(htmlDir, `${blogData.slug}.html`);
  await fs.writeFile(htmlPath, blogData.html);
  
  // Update blog index
  await updateBlogIndex(blogData);
  
  logger.info(`Blog post saved: ${blogData.slug}`);
  return { postDataPath, htmlPath };
}

/**
 * Update blog index with new post
 * @param {Object} blogData - The blog post data
 * @returns {Promise} - Resolves when index is updated
 */
async function updateBlogIndex(blogData) {
  const indexPath = path.join(__dirname, '../content/index.json');
  let blogIndex = [];
  
  // Read existing index if it exists
  if (await fs.pathExists(indexPath)) {
    const indexData = await fs.readFile(indexPath, 'utf8');
    blogIndex = JSON.parse(indexData);
  }
  
  // Create summary data for index
  const postSummary = {
    title: blogData.title,
    slug: blogData.slug,
    metaDescription: blogData.metaDescription,
    dateCreated: blogData.dateCreated,
    tags: blogData.tags,
    thumbnailUrl: blogData.images && blogData.images.length > 0 ? blogData.images[0].localPath : null,
    keyword: blogData.originalKeyword
  };
  
  // Add to index (avoid duplicates)
  const existingPostIndex = blogIndex.findIndex(post => post.slug === blogData.slug);
  if (existingPostIndex >= 0) {
    blogIndex[existingPostIndex] = postSummary;
  } else {
    blogIndex.push(postSummary);
  }
  
  // Sort by date (newest first)
  blogIndex.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  
  // Save updated index
  await fs.writeFile(indexPath, JSON.stringify(blogIndex, null, 2));
  
  // Generate HTML index
  await generateIndexHtml(blogIndex);
  
  logger.info(`Blog index updated with ${blogIndex.length} posts`);
}

/**
 * Generate HTML index page for the blog
 * @param {Array} blogIndex - The blog index data
 * @returns {Promise} - Resolves when index is generated
 */
async function generateIndexHtml(blogIndex) {
  const blogTitle = process.env.BLOG_TITLE || "Obsession Trigger Blog";
  const blogDescription = process.env.BLOG_DESCRIPTION || "Insights and advice on love, attraction, and relationships";
  const quizUrl = process.env.QUIZ_URL || "https://obsession-trigger.com";
  
  // Generate HTML for blog posts
  const postsHtml = blogIndex.map(post => `
    <article class="blog-card">
      ${post.thumbnailUrl ? `
        <div class="card-image">
          <a href="/articles/${post.slug}.html">
            <img src="${post.thumbnailUrl}" alt="${post.title}" loading="lazy">
          </a>
        </div>
      ` : ''}
      <div class="card-content">
        <h2><a href="/articles/${post.slug}.html">${post.title}</a></h2>
        <div class="post-meta">
          <time datetime="${post.dateCreated}">${new Date(post.dateCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        </div>
        <p class="excerpt">${post.metaDescription}</p>
        <div class="tags">
          ${post.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <a href="/articles/${post.slug}.html" class="read-more">Read Article</a>
      </div>
    </article>
  `).join('');
  
  // Full HTML template
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blogTitle} - Relationship Advice for Women</title>
  <meta name="description" content="${blogDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${process.env.BLOG_URL}">
  <meta property="og:title" content="${blogTitle}">
  <meta property="og:description" content="${blogDescription}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${process.env.BLOG_URL}">
  <meta property="twitter:title" content="${blogTitle}">
  <meta property="twitter:description" content="${blogDescription}">
  
  <!-- Stylesheet -->
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <div class="container">
      <nav>
        <a href="/" class="logo">${blogTitle}</a>
        <ul>
          <li><a href="/" class="active">Home</a></li>
          <li><a href="/articles">Articles</a></li>
          <li><a href="${quizUrl}" class="nav-cta">Take the Quiz</a></li>
        </ul>
      </nav>
    </div>
  </header>
  
  <main>
    <section class="hero">
      <div class="container">
        <h1>${blogTitle}</h1>
        <p>${blogDescription}</p>
        <a href="${quizUrl}" class="cta-button">Take Our Free Relationship Quiz</a>
      </div>
    </section>
    
    <section class="latest-posts">
      <div class="container">
        <h2>Latest Articles</h2>
        <div class="posts-grid">
          ${postsHtml}
        </div>
      </div>
    </section>
    
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>Want Personalized Relationship Advice?</h2>
          <p>Take our quiz to receive customized insights based on your specific situation.</p>
          <a href="${quizUrl}" class="cta-button-large">Start the Quiz</a>
        </div>
      </div>
    </section>
  </main>
  
  <footer class="site-footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-logo">
          <h2>${blogTitle}</h2>
          <p>${blogDescription}</p>
        </div>
        
        <div class="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/articles">Articles</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Use</a></li>
          </ul>
        </div>
        
        <div class="footer-newsletter">
          <h3>Subscribe for Updates</h3>
          <p>Get relationship tips delivered to your inbox.</p>
          <form class="newsletter-form">
            <input type="email" placeholder="Your email address" required>
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${blogTitle}. All rights reserved.</p>
      </div>
    </div>
  </footer>
  
  <script src="/js/script.js"></script>
</body>
</html>`;
  
  // Save index HTML
  const publicDir = path.join(__dirname, '../public');
  await fs.ensureDir(publicDir);
  await fs.writeFile(path.join(publicDir, 'index.html'), indexHtml);
  
  // Also generate an "articles" page
  const articlesHtml = indexHtml.replace('<li><a href="/" class="active">Home</a></li>', '<li><a href="/">Home</a></li>')
    .replace('<li><a href="/articles">Articles</a></li>', '<li><a href="/articles" class="active">Articles</a></li>')
    .replace('<h1>${blogTitle}</h1>', '<h1>All Articles</h1>')
    .replace(`<p>${blogDescription}</p>`, '<p>Browse our collection of relationship advice articles</p>');
  
  await fs.ensureDir(path.join(publicDir, 'articles'));
  await fs.writeFile(path.join(publicDir, 'articles/index.html'), articlesHtml);
  
  logger.info('Generated blog index and articles pages');
}

module.exports = {
  generateCompleteBlogPost
};
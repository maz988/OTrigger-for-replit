const fs = require('fs-extra');
const path = require('path');
const { generateBlogPost, ensureDataDirectories } = require('./openai');
const { searchImages, downloadImages } = require('./images');
const { generateHtml, generateSitemap } = require('./seo');
const { initializeKeywordTracking, markKeywordAsUsed } = require('./keywords');
const winston = require('winston');

// Initialize logger
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
    logger.info(`Starting blog post generation for keyword: "${keyword}"`);
    
    // Ensure required directories exist
    await ensureDataDirectories();
    await fs.ensureDir(path.join(__dirname, '../logs'));
    
    // Initialize keyword tracking
    await initializeKeywordTracking();
    
    // Generate blog post content using OpenAI
    logger.info('Generating blog post content with OpenAI');
    const blogData = await generateBlogPost(keyword);
    
    // Search and download relevant images
    logger.info('Searching for images related to the blog post');
    const images = await searchImages(keyword, 2);
    
    // Download images if found
    if (images && images.length > 0) {
      logger.info(`Found ${images.length} images, downloading them`);
      blogData.images = await downloadImages(images, blogData.slug);
    } else {
      logger.warn('No images found for the blog post');
      blogData.images = [];
    }
    
    // Save the blog post
    await saveBlogPost(blogData);
    
    // Update blog index
    await updateBlogIndex(blogData);
    
    // Mark the keyword as used
    await markKeywordAsUsed(keyword);
    
    logger.info(`Blog post generation completed successfully for: "${blogData.title}"`);
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
  try {
    logger.info(`Saving blog post: "${blogData.title}"`);
    
    // Save the raw blog data as JSON
    const postsDir = path.join(__dirname, '../data/posts');
    await fs.ensureDir(postsDir);
    
    const jsonPath = path.join(postsDir, `${blogData.slug}.json`);
    await fs.writeJson(jsonPath, blogData, { spaces: 2 });
    
    // Generate HTML and save it
    const html = generateHtml(blogData);
    
    const htmlDir = path.join(__dirname, '../public/posts');
    await fs.ensureDir(htmlDir);
    
    const htmlPath = path.join(htmlDir, `${blogData.slug}.html`);
    await fs.writeFile(htmlPath, html);
    
    logger.info(`Blog post saved successfully: "${blogData.title}"`);
    return { jsonPath, htmlPath };
  } catch (error) {
    logger.error(`Error saving blog post: ${error.message}`);
    throw error;
  }
}

/**
 * Update blog index with new post
 * @param {Object} blogData - The blog post data
 * @returns {Promise} - Resolves when index is updated
 */
async function updateBlogIndex(blogData) {
  try {
    logger.info('Updating blog index');
    
    const indexPath = path.join(__dirname, '../data/blog-index.json');
    let blogIndex = [];
    
    // Load existing index if it exists
    if (await fs.pathExists(indexPath)) {
      blogIndex = await fs.readJson(indexPath);
    }
    
    // Create an index entry with essential data
    const indexEntry = {
      title: blogData.title,
      description: blogData.description,
      slug: blogData.slug,
      date: blogData.date,
      tags: blogData.tags,
      readingTime: blogData.readingTime,
      featuredImage: blogData.images && blogData.images.length > 0 ? blogData.images[0].localPath : null
    };
    
    // Add to the beginning of the index
    blogIndex.unshift(indexEntry);
    
    // Sort by date (newest first)
    blogIndex.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save the updated index
    await fs.writeJson(indexPath, blogIndex, { spaces: 2 });
    
    // Generate HTML index page
    await generateIndexHtml(blogIndex);
    
    // Generate sitemap
    await generateSitemap(blogIndex);
    
    logger.info('Blog index updated successfully');
    return blogIndex;
  } catch (error) {
    logger.error(`Error updating blog index: ${error.message}`);
    throw error;
  }
}

/**
 * Generate HTML index page for the blog
 * @param {Array} blogIndex - The blog index data
 * @returns {Promise} - Resolves when index is generated
 */
async function generateIndexHtml(blogIndex) {
  try {
    logger.info('Generating blog index HTML');
    
    const indexTemplatePath = path.join(__dirname, '../public/index.html');
    let indexTemplate;
    
    try {
      indexTemplate = await fs.readFile(indexTemplatePath, 'utf8');
    } catch (error) {
      logger.error(`Error reading index template: ${error.message}`);
      return;
    }
    
    // Generate HTML for blog posts
    let postsHtml = '';
    
    for (const post of blogIndex.slice(0, 9)) { // Show only the latest 9 posts
      const postDate = new Date(post.date);
      const formattedDate = postDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const featuredImage = post.featuredImage 
        ? `<img src="${post.featuredImage}" alt="${post.title}" class="card-image">`
        : '';
      
      const tagsHtml = post.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('');
      
      postsHtml += `
        <article class="blog-card">
          ${featuredImage}
          <div class="card-content">
            <h3><a href="/posts/${post.slug}.html">${post.title}</a></h3>
            <div class="post-meta">
              <time datetime="${post.date}">${formattedDate}</time> · ${post.readingTime} min read
            </div>
            <p class="excerpt">${post.description}</p>
            <div class="tags">
              ${tagsHtml}
            </div>
          </div>
        </article>
      `;
    }
    
    // If no posts yet, show a placeholder
    if (postsHtml === '') {
      postsHtml = `
        <article class="blog-card">
          <div class="card-content">
            <h3>Posts will appear here soon</h3>
            <div class="post-meta">
              <time datetime="${new Date().toISOString()}">${new Date().toLocaleDateString()}</time>
            </div>
            <p class="excerpt">The automated blog system will generate and publish new relationship advice articles here. Check back soon!</p>
          </div>
        </article>
      `;
    }
    
    // Replace the posts placeholder in the template
    const updatedIndex = indexTemplate.replace(
      /<div class="posts-grid">([\s\S]*?)<\/div>/,
      `<div class="posts-grid">${postsHtml}</div>`
    );
    
    // Write the updated index.html
    await fs.writeFile(indexTemplatePath, updatedIndex);
    
    // Also generate an articles page that shows all posts
    const articlesDir = path.join(__dirname, '../public');
    await fs.ensureDir(articlesDir);
    
    // Create articles.html based on index.html template
    let articlesTemplate = updatedIndex;
    
    // Change the active nav item
    articlesTemplate = articlesTemplate.replace(
      /<li><a href="\/" class="active">Home<\/a><\/li>/,
      '<li><a href="/">Home</a></li>'
    );
    
    articlesTemplate = articlesTemplate.replace(
      /<li><a href="\/articles">Articles<\/a><\/li>/,
      '<li><a href="/articles" class="active">Articles</a></li>'
    );
    
    // Change the section titles
    articlesTemplate = articlesTemplate.replace(
      /<h2>Latest Articles<\/h2>/,
      '<h2>All Articles</h2>'
    );
    
    // Generate HTML for all blog posts
    let allPostsHtml = '';
    
    for (const post of blogIndex) {
      const postDate = new Date(post.date);
      const formattedDate = postDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const featuredImage = post.featuredImage 
        ? `<img src="${post.featuredImage}" alt="${post.title}" class="card-image">`
        : '';
      
      const tagsHtml = post.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('');
      
      allPostsHtml += `
        <article class="blog-card">
          ${featuredImage}
          <div class="card-content">
            <h3><a href="/posts/${post.slug}.html">${post.title}</a></h3>
            <div class="post-meta">
              <time datetime="${post.date}">${formattedDate}</time> · ${post.readingTime} min read
            </div>
            <p class="excerpt">${post.description}</p>
            <div class="tags">
              ${tagsHtml}
            </div>
          </div>
        </article>
      `;
    }
    
    // If no posts yet, show a placeholder
    if (allPostsHtml === '') {
      allPostsHtml = `
        <article class="blog-card">
          <div class="card-content">
            <h3>Posts will appear here soon</h3>
            <div class="post-meta">
              <time datetime="${new Date().toISOString()}">${new Date().toLocaleDateString()}</time>
            </div>
            <p class="excerpt">The automated blog system will generate and publish new relationship advice articles here. Check back soon!</p>
          </div>
        </article>
      `;
    }
    
    // Replace the posts placeholder in the articles template
    const updatedArticles = articlesTemplate.replace(
      /<div class="posts-grid">([\s\S]*?)<\/div>/,
      `<div class="posts-grid">${allPostsHtml}</div>`
    );
    
    // Write the articles.html file
    await fs.writeFile(path.join(articlesDir, 'articles.html'), updatedArticles);
    
    logger.info('Blog index HTML generated successfully');
  } catch (error) {
    logger.error(`Error generating blog index HTML: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateCompleteBlogPost,
  saveBlogPost,
  updateBlogIndex,
  generateIndexHtml
};
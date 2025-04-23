/**
 * Script to generate a demo blog post without API calls
 * This script generates a single blog post from a keyword
 * and saves it to the public directory
 */

const fs = require('fs');
const path = require('path');
const tracking = require('./utils/tracking');

// Simple slugify function since the slug module is ESM
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-');     // Replace multiple - with single -
}

// Demo function to generate a blog post
function generateBlogPost(keyword) {
  console.log(`Generating demo blog post for keyword: ${keyword}`);
  
  // Generate title based on keyword
  const title = `How to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
  
  // Generate slug from title
  const postSlug = slugify(title);
  
  // Create blog data object for tracking
  const blogData = {
    title,
    slug: postSlug,
    keyword
  };
  
  // Generate quiz URL with tracking parameters
  const quizUrl = tracking.getQuizUrl('https://obsession-trigger.com/quiz', blogData);
  
  // Current date
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const displayDate = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Tags related to the keyword
  const tags = ['Relationships', 'Psychology', 'Attraction', 'Dating', 'Love'];
  
  // Generate HTML content
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Obsession Trigger</title>
  <meta name="description" content="Discover the science behind building a deep emotional connection and learn how to ${keyword} effectively in your relationship.">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://obsession-trigger.com/posts/${postSlug}.html">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="Discover the science behind building a deep emotional connection and learn how to ${keyword} effectively in your relationship.">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://obsession-trigger.com/posts/${postSlug}.html">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="Discover the science behind building a deep emotional connection and learn how to ${keyword} effectively in your relationship.">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/images/favicon.png">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Font Awesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  
  <!-- Custom CSS -->
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="container">
      <nav class="nav">
        <a href="/" class="logo">
          <span>Obsession Trigger</span>
        </a>
        
        <ul class="menu">
          <li><a href="/">Home</a></li>
          <li><a href="/articles" class="active">Articles</a></li>
          <li><a href="${quizUrl}" target="_blank">Take the Quiz</a></li>
          <li><a href="/about">About</a></li>
        </ul>
        
        <button class="mobile-menu-btn">
          <i class="fas fa-bars"></i>
        </button>
      </nav>
    </div>
  </header>
  
  <!-- Post Header -->
  <header class="post-header">
    <div class="container">
      <h1 class="post-title">${title}</h1>
      <div class="post-meta-header">
        <time datetime="${formattedDate}">${displayDate}</time> · 8 min read
      </div>
      <div class="tags">
        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  </header>
  
  <!-- Post Content -->
  <main class="post-content">
    <p>Understanding how to build a deep emotional connection with your partner is a vital aspect of creating a lasting and fulfilling relationship. This guide explores the psychological principles behind ${keyword} and provides practical strategies you can implement today.</p>
    
    <h2>The Psychology of Emotional Connection</h2>
    
    <p>Research in relationship psychology shows that emotional connection is built on several foundational elements:</p>
    
    <ul>
      <li><strong>Vulnerability:</strong> The willingness to share your authentic self</li>
      <li><strong>Active listening:</strong> Being fully present and engaged when your partner speaks</li>
      <li><strong>Validation:</strong> Acknowledging and respecting your partner's feelings</li>
      <li><strong>Shared experiences:</strong> Creating meaningful memories together</li>
    </ul>
    
    <p>When these elements are present, both partners feel seen, heard, and valued - the essential components of a secure attachment.</p>
    
    <h2>Why ${keyword} Matters in Relationships</h2>
    
    <p>The ability to ${keyword} effectively creates a foundation of trust and intimacy that serves as a buffer against relationship challenges. Couples who master this skill experience:</p>
    
    <ul>
      <li>Greater relationship satisfaction over time</li>
      <li>More effective conflict resolution</li>
      <li>Higher levels of intimacy and closeness</li>
      <li>Increased resilience during difficult periods</li>
    </ul>
    
    <p>Our <a href="${quizUrl}">relationship assessment quiz</a> has helped thousands of couples identify their unique emotional connection patterns and develop personalized strategies for improvement.</p>
    
    <blockquote>
      <p>"Understanding how to ${keyword} transformed our relationship completely. What once felt like a constant struggle now feels natural and fulfilling." — Sarah, 32</p>
    </blockquote>
    
    <h2>5 Practical Ways to ${keyword}</h2>
    
    <h3>1. Create a judgment-free space</h3>
    <p>For emotional connection to flourish, both partners need to feel safe expressing themselves without fear of criticism or dismissal. Practice responding with curiosity rather than judgment when your partner shares something vulnerable.</p>
    
    <h3>2. Develop rituals of connection</h3>
    <p>Relationship researchers have found that couples who maintain small, consistent rituals of connection experience greater relationship satisfaction. This might be a morning coffee together, a goodbye kiss, or a nightly check-in about your day.</p>
    
    <h3>3. Practice emotional attunement</h3>
    <p>Emotional attunement means recognizing and responding to your partner's emotional needs. This requires developing awareness of your partner's non-verbal cues and learning to ask clarifying questions when uncertain.</p>
    
    <h3>4. Share your internal world</h3>
    <p>Many people struggle with ${keyword} because they don't share their thoughts, feelings, and experiences with their partner. Make a conscious effort to share both your daily experiences and deeper reflections.</p>
    
    <h3>5. Show appreciation consistently</h3>
    <p>Research by Dr. John Gottman found that relationships thrive when positive interactions outnumber negative ones by at least 5:1. Regular expressions of appreciation help maintain this positive balance.</p>
    
    <p>For personalized guidance on how to improve these skills in your specific relationship dynamic, take our comprehensive <a href="${quizUrl}">relationship assessment</a>.</p>
    
    <h2>Common Challenges to ${keyword}</h2>
    
    <p>Even with the best intentions, several common obstacles can interfere with your ability to ${keyword}:</p>
    
    <ul>
      <li><strong>Past relationship wounds</strong> that create fear of vulnerability</li>
      <li><strong>Communication patterns</strong> learned in your family of origin</li>
      <li><strong>Stress and busyness</strong> that reduce emotional availability</li>
      <li><strong>Assumption of mind-reading</strong> rather than clear expression</li>
    </ul>
    
    <p>Recognizing these challenges is the first step toward overcoming them. Our assessment helps identify which specific obstacles are most relevant in your relationship.</p>
    
    <h2>Conclusion</h2>
    
    <p>Learning how to ${keyword} is not a one-time achievement but an ongoing practice that evolves as your relationship grows. By implementing the strategies outlined above and maintaining awareness of common challenges, you can create a relationship characterized by deep understanding and lasting connection.</p>
    
    <p>Ready to discover your unique emotional connection profile and receive tailored guidance? Take our free <a href="${quizUrl}">relationship assessment quiz</a> today.</p>
    
    <div class="post-footer">
      <div class="post-cta">
        <h3>Discover Your Relationship Potential</h3>
        <p>Ready to transform your relationship? Take our free quiz to receive personalized insights and strategies tailored specifically to your situation.</p>
        <a href="${quizUrl}" class="btn btn-primary">Take the Quiz Now</a>
      </div>
      
      <div class="related-posts">
        <h3>Related Articles</h3>
        <div class="related-posts-grid">
          <div class="related-post-card">
            <div class="related-post-content">
              <h4><a href="#">Signs He Is Secretly Attracted to You</a></h4>
              <div class="post-meta">
                <time datetime="2025-04-20">April 20, 2025</time> · 6 min read
              </div>
            </div>
          </div>
          <div class="related-post-card">
            <div class="related-post-content">
              <h4><a href="#">How to Trigger Attraction in Men</a></h4>
              <div class="post-meta">
                <time datetime="2025-04-18">April 18, 2025</time> · 7 min read
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-column">
          <h3>Obsession Trigger</h3>
          <p>Expert relationship advice to help women create passionate, lasting connections with their partners.</p>
          <div class="social-links">
            <a href="#" class="social-link"><i class="fab fa-facebook-f"></i></a>
            <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
            <a href="#" class="social-link"><i class="fab fa-pinterest-p"></i></a>
            <a href="#" class="social-link"><i class="fab fa-youtube"></i></a>
          </div>
        </div>
        
        <div class="footer-column">
          <h3>Explore</h3>
          <ul class="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/articles">Articles</a></li>
            <li><a href="${quizUrl}">Quiz</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        
        <div class="footer-column">
          <h3>Categories</h3>
          <ul class="footer-links">
            <li><a href="/articles?category=attraction">Attraction</a></li>
            <li><a href="/articles?category=communication">Communication</a></li>
            <li><a href="/articles?category=dating">Dating</a></li>
            <li><a href="/articles?category=relationships">Relationships</a></li>
            <li><a href="/articles?category=psychology">Psychology</a></li>
          </ul>
        </div>
        
        <div class="footer-column">
          <h3>Subscribe</h3>
          <p>Get our latest articles and relationship tips delivered straight to your inbox.</p>
          <form class="newsletter-form">
            <input type="email" class="newsletter-input" placeholder="Your email address">
            <button type="submit" class="newsletter-btn"><i class="fas fa-arrow-right"></i></button>
          </form>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2025 Obsession Trigger. All rights reserved.</p>
      </div>
    </div>
  </footer>
  
  <!-- Custom JavaScript -->
  <script src="/js/script.js"></script>
</body>
</html>`;

  // Return the blog post data
  return {
    title,
    slug: postSlug,
    keyword,
    date: formattedDate,
    tags,
    html: htmlContent
  };
}

// Save blog post to the filesystem
function saveBlogPost(blogPost) {
  try {
    // Ensure the posts directory exists
    const postsDir = path.join(__dirname, 'public', 'posts');
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }
    
    // Save HTML file
    const htmlPath = path.join(postsDir, `${blogPost.slug}.html`);
    fs.writeFileSync(htmlPath, blogPost.html);
    
    console.log(`Blog post saved to: ${htmlPath}`);
    
    // Update the blog index with the new post
    updateBlogIndex(blogPost);
    
    return {
      success: true,
      path: htmlPath
    };
  } catch (error) {
    console.error('Error saving blog post:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Update the blog index with the new post
function updateBlogIndex(blogPost) {
  try {
    // Create a simple index entry for the post
    const indexEntry = {
      title: blogPost.title,
      slug: blogPost.slug,
      date: blogPost.date,
      tags: blogPost.tags
    };
    
    // Path to the index file
    const indexPath = path.join(__dirname, 'data', 'blog-index.json');
    
    // Read existing index or create a new one
    let blogIndex = [];
    if (fs.existsSync(indexPath)) {
      const indexData = fs.readFileSync(indexPath, 'utf8');
      blogIndex = JSON.parse(indexData);
    }
    
    // Add the new post to the index (at the beginning)
    blogIndex.unshift(indexEntry);
    
    // Write the updated index back to the file
    fs.writeFileSync(indexPath, JSON.stringify(blogIndex, null, 2));
    
    console.log('Blog index updated successfully');
    
    // Generate the HTML index page
    generateIndexHtml(blogIndex);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating blog index:', error);
    return { 
      success: false,
      error: error.message
    };
  }
}

// Generate the HTML index page
function generateIndexHtml(blogIndex) {
  try {
    // Generate HTML for each blog post card
    const blogCardsHtml = blogIndex.map(post => {
      return `
        <article class="blog-card">
          <div class="card-content">
            <h3><a href="/posts/${post.slug}.html">${post.title}</a></h3>
            <div class="post-meta">
              <time datetime="${post.date}">${new Date(post.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</time> · 8 min read
            </div>
            <p class="excerpt">Discover the psychology and practical strategies behind building deeper relationships and stronger connections.</p>
            <div class="tags">
              ${post.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
        </article>
      `;
    }).join('');
    
    // Read the existing index.html file
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    
    // Replace the posts grid section with the new blog cards
    const postsGridRegex = /(<div class="posts-grid">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)/;
    indexHtml = indexHtml.replace(postsGridRegex, `$1\n${blogCardsHtml}\n      $2`);
    
    // Write the updated index.html file
    fs.writeFileSync(indexPath, indexHtml);
    
    console.log('Index HTML updated successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Error generating index HTML:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Demo script - run this to generate a sample blog post
function generateDemoBlogPost() {
  try {
    // Sample keywords for demo
    const sampleKeywords = [
      'make him want you more',
      'create emotional intimacy',
      'build a deep connection',
      'make him obsessed with you',
      'trigger his attachment'
    ];
    
    // Choose a random keyword
    const randomKeyword = sampleKeywords[Math.floor(Math.random() * sampleKeywords.length)];
    console.log(`Selected keyword: "${randomKeyword}"`);
    
    // Generate blog post
    const blogPost = generateBlogPost(randomKeyword);
    
    // Save blog post
    const saveResult = saveBlogPost(blogPost);
    
    if (saveResult.success) {
      console.log('Demo blog post generated and saved successfully!');
      console.log(`You can view the post at: /blog/public/posts/${blogPost.slug}.html`);
    } else {
      console.error('Failed to save demo blog post:', saveResult.error);
    }
    
    return blogPost;
  } catch (error) {
    console.error('Error in demo blog generation:', error);
  }
}

// Export functions
module.exports = {
  generateBlogPost,
  saveBlogPost,
  generateDemoBlogPost
};

// If this script is run directly (not imported), generate a demo post
if (require.main === module) {
  console.log('=== GENERATING DEMO BLOG POST ===');
  generateDemoBlogPost();
}
const dotenv = require('dotenv');
const path = require('path');
const showdown = require('showdown');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize markdown converter
const converter = new showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true
});

/**
 * Generate JSON-LD schema for a blog post
 * @param {Object} post - The blog post data
 * @returns {string} JSON-LD schema markup
 */
function generateJsonLd(post) {
  const blogUrl = process.env.BLOG_URL || 'https://obsession-trigger-blog.com';
  const authorName = process.env.BLOG_AUTHOR || 'Relationship Expert';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${blogUrl}/${post.slug}`
    },
    "headline": post.title,
    "description": post.metaDescription,
    "image": post.images && post.images.length > 0 ? [`${blogUrl}${post.images[0].localPath}`] : [],
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": process.env.BLOG_TITLE || "Obsession Trigger Blog",
      "logo": {
        "@type": "ImageObject",
        "url": `${blogUrl}/logo.png`
      }
    },
    "datePublished": post.dateCreated,
    "dateModified": post.dateCreated,
    "keywords": post.tags.join(", ")
  };
  
  return JSON.stringify(schema);
}

/**
 * Convert markdown content to HTML with SEO enhancements
 * @param {Object} post - The blog post data
 * @param {boolean} includeLayout - Whether to include the full HTML layout
 * @returns {string} HTML content
 */
function generateHtml(post, includeLayout = true) {
  // Convert markdown to HTML
  let htmlContent = converter.makeHtml(post.content);
  
  // Add internal links to quiz
  const quizUrl = process.env.QUIZ_URL || 'https://obsession-trigger.com';
  const quizCta = `<div class="quiz-cta">
    <p>Ready to get personalized advice for your relationship situation?</p>
    <a href="${quizUrl}" class="cta-button">Take Our Free Relationship Quiz</a>
  </div>`;
  
  // Insert quiz CTA after the first H2
  htmlContent = htmlContent.replace(/<\/h2>/, '</h2>' + quizCta);
  
  // Add affiliate link if provided
  if (process.env.AFFILIATE_LINK) {
    const affiliateLink = `<div class="affiliate-cta">
      <p>Looking for more relationship resources? Check out our <a href="${process.env.AFFILIATE_LINK}" target="_blank" rel="nofollow">recommended relationship program</a> that has helped thousands of women.</p>
    </div>`;
    
    // Add affiliate link after the third paragraph
    let paragraphCount = 0;
    htmlContent = htmlContent.replace(/<\/p>/g, (match) => {
      paragraphCount++;
      if (paragraphCount === 3) {
        return match + affiliateLink;
      }
      return match;
    });
  }
  
  // Add image attribution and alt text
  if (post.images && post.images.length > 0) {
    // Add first image after intro paragraph
    const firstImageHtml = `<div class="post-image">
      <img src="${post.images[0].localPath}" alt="${post.images[0].alt}" width="${post.images[0].width}" height="${post.images[0].height}" loading="lazy" />
      <small class="image-attribution">${post.images[0].attribution}</small>
    </div>`;
    
    // Add after first paragraph
    htmlContent = htmlContent.replace(/<\/p>/, '</p>' + firstImageHtml);
    
    // Add second image if available
    if (post.images.length > 1) {
      const secondImageHtml = `<div class="post-image">
        <img src="${post.images[1].localPath}" alt="${post.images[1].alt}" width="${post.images[1].width}" height="${post.images[1].height}" loading="lazy" />
        <small class="image-attribution">${post.images[1].attribution}</small>
      </div>`;
      
      // Add second image halfway through the content
      const contentParts = htmlContent.split('</p>');
      if (contentParts.length > 3) {
        const middleIndex = Math.floor(contentParts.length / 2);
        contentParts[middleIndex] = contentParts[middleIndex] + secondImageHtml;
        htmlContent = contentParts.join('</p>');
      }
    }
  }
  
  // If we just want the content (not the full HTML document)
  if (!includeLayout) {
    return htmlContent;
  }
  
  // Generate complete HTML with head, scripts, etc.
  const jsonLd = generateJsonLd(post);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
  <meta name="description" content="${post.metaDescription}">
  <meta name="keywords" content="${post.tags.join(', ')}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${process.env.BLOG_URL}/${post.slug}">
  <meta property="og:title" content="${post.title}">
  <meta property="og:description" content="${post.metaDescription}">
  ${post.images && post.images.length > 0 ? `<meta property="og:image" content="${process.env.BLOG_URL}${post.images[0].localPath}">` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${process.env.BLOG_URL}/${post.slug}">
  <meta property="twitter:title" content="${post.title}">
  <meta property="twitter:description" content="${post.metaDescription}">
  ${post.images && post.images.length > 0 ? `<meta property="twitter:image" content="${process.env.BLOG_URL}${post.images[0].localPath}">` : ''}
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${process.env.BLOG_URL}/${post.slug}">
  
  <!-- Schema.org markup -->
  <script type="application/ld+json">
    ${jsonLd}
  </script>
  
  <!-- Stylesheet -->
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <div class="container">
      <nav>
        <a href="/" class="logo">${process.env.BLOG_TITLE || "Obsession Trigger Blog"}</a>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/articles">Articles</a></li>
          <li><a href="${process.env.QUIZ_URL}" class="nav-cta">Take the Quiz</a></li>
        </ul>
      </nav>
    </div>
  </header>
  
  <main>
    <article class="blog-post container">
      <header class="post-header">
        <h1>${post.title}</h1>
        <div class="post-meta">
          <time datetime="${post.dateCreated}">${new Date(post.dateCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
          <div class="tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      </header>
      
      <div class="post-content">
        ${htmlContent}
      </div>
      
      <footer class="post-footer">
        <div class="author-bio">
          <h3>About the Author</h3>
          <p>${process.env.BLOG_AUTHOR || "Relationship Expert"} specializes in helping women navigate relationships with confidence and clarity.</p>
        </div>
        
        <div class="share-post">
          <h3>Share This Article</h3>
          <div class="social-share">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${process.env.BLOG_URL}/${post.slug}" target="_blank" rel="noopener">Facebook</a>
            <a href="https://twitter.com/intent/tweet?url=${process.env.BLOG_URL}/${post.slug}&text=${encodeURIComponent(post.title)}" target="_blank" rel="noopener">Twitter</a>
            <a href="https://pinterest.com/pin/create/button/?url=${process.env.BLOG_URL}/${post.slug}&media=${post.images && post.images.length > 0 ? `${process.env.BLOG_URL}${post.images[0].localPath}` : ''}&description=${encodeURIComponent(post.metaDescription)}" target="_blank" rel="noopener">Pinterest</a>
          </div>
        </div>
        
        <div class="related-posts">
          <h3>Related Articles</h3>
          <p>Coming soon...</p>
        </div>
        
        <div class="quiz-cta-large">
          <h3>Get Personalized Relationship Advice</h3>
          <p>Take our free relationship quiz and receive customized advice based on your unique situation.</p>
          <a href="${process.env.QUIZ_URL}" class="cta-button-large">Start the Quiz</a>
        </div>
      </footer>
    </article>
  </main>
  
  <footer class="site-footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-logo">
          <h2>${process.env.BLOG_TITLE || "Obsession Trigger Blog"}</h2>
          <p>${process.env.BLOG_DESCRIPTION || "Insights and advice on love, attraction, and relationships"}</p>
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
        <p>&copy; ${new Date().getFullYear()} ${process.env.BLOG_TITLE || "Obsession Trigger Blog"}. All rights reserved.</p>
      </div>
    </div>
  </footer>
  
  <script src="/js/script.js"></script>
</body>
</html>`;
}

module.exports = {
  generateJsonLd,
  generateHtml
};
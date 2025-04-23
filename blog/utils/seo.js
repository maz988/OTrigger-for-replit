const showdown = require('showdown');
const markdownIt = require('markdown-it');
const fs = require('fs-extra');
const path = require('path');

// Initialize Markdown converters
const converter = new showdown.Converter({
  tables: true,
  simpleLineBreaks: true,
  strikethrough: true,
  tasklists: true,
  emoji: true
});

const md = new markdownIt({
  html: true,
  linkify: true,
  typographer: true
});

/**
 * Generate JSON-LD schema for a blog post
 * @param {Object} post - The blog post data
 * @returns {string} JSON-LD schema markup
 */
function generateJsonLd(post) {
  const blogUrl = process.env.BLOG_URL || 'https://obsession-trigger-blog.com';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${blogUrl}/${post.slug}`
    },
    "headline": post.title,
    "description": post.description,
    "image": post.images && post.images.length > 0 ? `${blogUrl}${post.images[0].localPath}` : "",
    "author": {
      "@type": "Person",
      "name": process.env.BLOG_AUTHOR || "Relationship Expert"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Obsession Trigger",
      "logo": {
        "@type": "ImageObject",
        "url": `${blogUrl}/images/logo.png`
      }
    },
    "datePublished": post.date,
    "dateModified": post.date,
    "keywords": post.tags.join(", ")
  };
  
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Convert markdown content to HTML with SEO enhancements
 * @param {Object} post - The blog post data
 * @param {boolean} includeLayout - Whether to include the full HTML layout
 * @returns {string} HTML content
 */
function generateHtml(post, includeLayout = true) {
  // Replace quiz reference with actual links
  let processedContent = post.content.replace(
    /our Obsession Trigger [Qq]uiz|our free [Qq]uiz|Obsession Trigger [Qq]uiz|the [Qq]uiz/g, 
    match => `<a href="${process.env.QUIZ_URL || 'https://obsession-trigger.com'}" class="quiz-link">${match}</a>`
  );
  
  // Convert markdown to HTML
  const htmlContent = md.render(processedContent);
  
  // Generate the complete HTML if requested
  if (!includeLayout) {
    return htmlContent;
  }
  
  // Read the template file
  const templatePath = path.join(__dirname, '../public/post-template.html');
  let template;
  
  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error('Error reading template file:', error);
    return htmlContent;
  }
  
  // Prepare data for template
  const date = new Date(post.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate related posts (placeholders for now)
  let relatedPosts = '';
  const relatedPostsHtml = `
    <article class="blog-card">
      <div class="card-content">
        <h3><a href="/">More posts coming soon!</a></h3>
        <div class="post-meta">
          <time datetime="${new Date().toISOString()}">${new Date().toLocaleDateString()}</time>
        </div>
        <p class="excerpt">Check back for more relationship advice articles.</p>
      </div>
    </article>
  `;
  relatedPosts = relatedPostsHtml.repeat(3);
  
  // Prepare image data
  const featuredImage = post.images && post.images.length > 0
    ? post.images[0].localPath
    : '/images/default-featured.jpg';
  
  const imageAlt = post.images && post.images.length > 0
    ? post.images[0].alt
    : `Featured image for ${post.title}`;
  
  const imageCaption = post.images && post.images.length > 0
    ? post.images[0].attribution
    : '';
  
  // Replace template variables
  const finalHtml = template
    .replace(/{{title}}/g, post.title)
    .replace(/{{description}}/g, post.description)
    .replace(/{{slug}}/g, post.slug)
    .replace(/{{content}}/g, htmlContent)
    .replace(/{{dateIso}}/g, post.date)
    .replace(/{{dateFormatted}}/g, formattedDate)
    .replace(/{{readingTime}}/g, post.readingTime)
    .replace(/{{featuredImage}}/g, featuredImage)
    .replace(/{{imageAlt}}/g, imageAlt)
    .replace(/{{imageCaption}}/g, imageCaption)
    .replace(/{{relatedPosts}}/g, relatedPosts)
    .replace(/{{jsonLd}}/g, generateJsonLd(post));
  
  return finalHtml;
}

/**
 * Generate a sitemap.xml file for the blog
 * @param {Array} blogIndex - Array of blog posts
 * @returns {Promise} Resolves when the sitemap is written
 */
async function generateSitemap(blogIndex) {
  const blogUrl = process.env.BLOG_URL || 'https://obsession-trigger-blog.com';
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add homepage
  sitemap += `  <url>
    <loc>${blogUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;
  
  // Add each blog post
  for (const post of blogIndex) {
    sitemap += `  <url>
    <loc>${blogUrl}/${post.slug}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  }
  
  // Close the sitemap
  sitemap += '</urlset>';
  
  // Write the sitemap
  await fs.writeFile(path.join(__dirname, '../public/sitemap.xml'), sitemap);
}

module.exports = {
  generateJsonLd,
  generateHtml,
  generateSitemap
};
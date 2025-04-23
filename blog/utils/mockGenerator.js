/**
 * Mock blog content generator for development and testing
 * Use this when you want to test without making OpenAI API calls
 */

const fs = require('fs');
const path = require('path');
const showdown = require('showdown');
const slugify = require('slug');

// Sample blog post templates based on common relationship topics
const blogTemplates = [
  {
    title: "How to Make Him Chase You: Psychology-Based Strategies",
    content: `
# How to Make Him Chase You: Psychology-Based Strategies

Have you ever wondered why some women seem to effortlessly attract men who pursue them with unwavering interest? It's not about looks alone - it's about understanding male psychology and creating the right emotional environment.

## The Psychology Behind Male Pursuit

Men are naturally drawn to what feels earned rather than freely given. This psychological principle, known as the "chase theory," suggests that humans value what they have to work for. When a man feels he's earning your attention rather than receiving it automatically, it triggers his natural pursuit instincts.

Research shows that moderate uncertainty in the early stages of dating creates higher levels of attraction. This doesn't mean playing manipulative games, but rather focusing on your own fulfilling life while creating space for him to wonder about you.

## Maintain Your Independence

One of the most attractive qualities you can display is genuine independence. Men are drawn to women who have:

* Their own passions and interests
* A fulfilling social circle
* Goals and ambitions separate from relationships
* Healthy boundaries

When you maintain your independent life, you naturally create the space that makes him want to bridge the gap between you. This is far more effective than making yourself constantly available.

## Master the Art of Self-Confidence

Self-confidence is magnetic. When you truly value yourself, it signals to him that you're a high-value partner worth pursuing. Confidence comes from:

* Knowing your worth and refusing to compromise on respect
* Being comfortable expressing your genuine opinions
* Taking care of your physical and emotional wellbeing
* Celebrating your unique qualities

Our [relationship assessment quiz](https://obsession-trigger.com/quiz) can help identify your natural strengths and provide personalized strategies for building authentic confidence.

## Create Healthy Space

While it might seem counterintuitive, creating space between you and the man you're interested in often accelerates his pursuit. This means:

* Maintaining some mystery about your activities
* Not always being the first to initiate contact
* Occasionally being unavailable due to genuine commitments
* Giving him room to miss your presence

This strategy works because it triggers his natural curiosity and gives him the opportunity to realize how much he enjoys your company.

## Focus on Positive Reinforcement

Men, like everyone, are drawn to positive experiences. When he does make efforts to pursue you, acknowledge and appreciate them. This creates a positive feedback loop that encourages more of the same behavior.

Positive reinforcement can include:

* Expressing genuine gratitude for thoughtful gestures
* Showing enthusiasm when spending time together
* Acknowledging his efforts in meaningful ways
* Creating enjoyable shared experiences

## Communicate Authentically

While creating space and maintaining independence are important, authentic communication forms the foundation of any healthy connection. When you do communicate:

* Express your genuine interest without over-pursuing
* Share your feelings with confidence rather than neediness
* Be clear about your boundaries and expectations
* Remain emotionally honest without overexposing

## Conclusion

The art of making him chase you isn't about manipulation or playing games. It's about understanding male psychology while remaining true to yourself. By maintaining your independence, building genuine confidence, creating healthy space, using positive reinforcement, and communicating authentically, you create the perfect conditions for him to pursue you naturally.

For personalized insights tailored to your specific relationship patterns, take our [comprehensive assessment](https://obsession-trigger.com/quiz) today.
`,
    description: "Discover psychology-based strategies that trigger a man's natural desire to pursue you. Learn how to create the perfect balance of interest and independence."
  },
  {
    title: "5 Signs He's Emotionally Attached (Even If He Hasn't Said It)",
    content: `
# 5 Signs He's Emotionally Attached (Even If He Hasn't Said It)

Understanding a man's emotional attachment can be challenging when he hasn't verbalized his feelings. Men often express emotional connection through actions rather than words. Here are five reliable signs that he's emotionally invested, even if he hasn't explicitly said so.

## 1. He Prioritizes Quality Time With You

When a man is emotionally attached, he makes spending time with you a priority in his life. This manifests as:

* Consistently making and keeping plans
* Adjusting his schedule to accommodate yours
* Being fully present (putting away his phone, actively listening)
* Remembering small details from your conversations

Research shows that time investment is one of the strongest indicators of emotional attachment. When a man willingly allocates his most precious resource—time—to you, it demonstrates that you matter deeply to him.

## 2. He Introduces You To His Inner Circle

Men are selective about who they bring into their established social networks. When he introduces you to:

* Close friends who have known him for years
* Family members, especially those he's close to
* Colleagues or mentors he respects
* People who are important to his future plans

This signals that he sees you as a significant part of his life. He's essentially integrating you into his identity and long-term vision.

## 3. He Shows Vulnerability Around You

Men are typically socialized to maintain emotional armor. When a man allows himself to be vulnerable with you, it indicates profound trust and attachment. Signs include:

* Sharing fears, insecurities, or past disappointments
* Discussing future hopes that he hasn't achieved yet
* Revealing childhood experiences that shaped him
* Expressing uncertainty or seeking your advice

This vulnerability doesn't always come in dramatic emotional displays. Often, it appears in quiet moments of honesty about things he wouldn't share with casual acquaintances.

## 4. He Demonstrates Protective Behavior

A man's protective instinct activates strongly toward those he feels emotionally connected to. This isn't about controlling behavior, but rather about:

* Checking that you arrived home safely
* Offering help during stressful situations
* Being attentive to your comfort and wellbeing
* Standing up for you when necessary

These protective behaviors stem from genuine concern for your welfare, indicating he's emotionally invested in your happiness and safety.

## 5. He Includes You In Future Planning

Perhaps the most telling sign of emotional attachment is when he naturally includes you in his vision of the future. This appears as:

* Using "we" language when discussing upcoming events
* Making plans weeks or months in advance
* Considering your preferences in his decision-making
* Discussing hypothetical future scenarios that include you

When a man mentally positions you in his future, it demonstrates that he's emotionally attached and sees the relationship as having long-term potential.

## Understanding His Emotional Timeline

Remember that men often process emotional attachment differently than women. Research indicates men typically take longer to recognize and verbalize their feelings, even when behaviorally they're already showing signs of attachment.

Our [relationship assessment](https://obsession-trigger.com/quiz) can help you identify your partner's emotional attachment patterns and provide personalized insights on how to deepen your connection.

## Conclusion

While verbal confirmation of feelings is important, actions often reveal emotional attachment more reliably than words. By recognizing these five key signs, you can better understand where you stand in his emotional landscape, even if he hasn't explicitly stated his feelings yet.

For more insights on male psychology and relationship dynamics, take our free [comprehensive relationship quiz](https://obsession-trigger.com/quiz) to receive personalized guidance based on your specific situation.
`,
    description: "Learn the subtle but definitive signs that reveal his emotional attachment, even when he hasn't verbalized his feelings yet. Understand the male perspective on emotional connection."
  },
  {
    title: "The Psychology of Attraction: Why He Can't Stop Thinking About You",
    content: `
# The Psychology of Attraction: Why He Can't Stop Thinking About You

Have you ever wondered why certain people occupy our thoughts so persistently? The psychology of attraction is a fascinating field that explains why someone can't get you out of their mind. Understanding these psychological triggers can help you create deeper, more memorable connections.

## The Dopamine Factor

At the neurochemical level, attraction and obsessive thinking are closely linked to dopamine, the brain's "reward" chemical. When someone associates you with positive feelings:

* Their brain releases dopamine in your presence
* This creates a neurological reward pathway
* The brain seeks to repeat experiences that trigger this reward
* You become associated with pleasure in their neural circuitry

Research shows that unpredictable rewards create stronger dopamine responses than predictable ones. This explains why moderate uncertainty in relationships often intensifies attraction rather than diminishing it.

## The Power of Emotional Contrast

One of the most powerful triggers for persistent thoughts is emotional contrast. When someone experiences varying emotional states with you rather than constant positivity, it creates a much more memorable impression. This includes:

* Moments of deep connection followed by healthy space
* Intellectual stimulation and playful banter
* Vulnerability balanced with strength
* Warmth balanced with independence

This emotional contrast creates what psychologists call "arousal" (not necessarily sexual, but general emotional activation), which dramatically increases how memorable you become.

## Authentic Fascination

Nothing makes someone think about you more than feeling genuinely seen and appreciated. When you display authentic interest in who they are:

* You activate their self-disclosure reward pathway
* They feel uniquely understood and valued
* Their sense of identity feels validated
* They associate this positive self-feeling with your presence

To discover your natural ability to create this authentic connection, take our [relationship assessment quiz](https://obsession-trigger.com/quiz) for personalized insights.

## The Unfinished Business Effect

Psychologists have identified the "Zeigarnik effect" - our tendency to remember uncompleted tasks better than completed ones. In relationships, this means:

* Conversations that leave something unsaid create lingering thoughts
* Questions that prompt self-reflection stay in mind
* Partially revealed aspects of your personality create curiosity
* Mild uncertainty about where they stand with you maintains attention

This isn't about playing games, but rather understanding that complete immediate disclosure often reduces the natural psychological tension that keeps someone thinking about you.

## Identity Challenge and Growth

People become psychologically invested in those who gently challenge them to grow. When you:

* Present new perspectives that expand their thinking
* Inspire them to develop untapped aspects of themselves
* Believe in capabilities they haven't fully expressed
* Challenge their assumptions in respectful ways

You become associated with their evolving identity and personal growth, creating a powerful psychological attachment.

## Multisensory Imprinting

Attraction involves all five senses, creating a multisensory imprint that strengthens memory. Consider:

* Your unique scent (the sense most strongly tied to memory)
* The distinct sound of your voice or laugh
* Visual details unique to your appearance or expressions
* The physical sensation of your touch
* Even taste associations (like a particular food you shared)

These sensory memories create a rich, detailed impression that keeps you present in someone's thoughts even in your physical absence.

## Conclusion

The psychology behind why someone can't stop thinking about you involves a complex interplay of neurochemistry, emotional patterns, authenticity, psychological principles, personal growth, and sensory experiences. By understanding these elements, you can create more meaningful connections based on genuine compatibility rather than manipulation.

To discover your unique attraction patterns and receive personalized insights, take our comprehensive [relationship assessment](https://obsession-trigger.com/quiz) today.
`,
    description: "Discover the proven psychological principles that make someone think about you constantly. Learn how certain behaviors trigger powerful attraction responses in the male brain."
  }
];

// Get a random blog template
function getRandomTemplate() {
  const randomIndex = Math.floor(Math.random() * blogTemplates.length);
  return blogTemplates[randomIndex];
}

// Generate a blog post title based on keyword
function generateTitle(keyword) {
  // Create variations based on the keyword
  const titleTemplates = [
    `5 Ways to ${keyword} That Actually Work`,
    `The Psychology Behind ${keyword}: Expert Advice`,
    `How to ${keyword}: A Comprehensive Guide`,
    `Why ${keyword} Is Essential for Healthy Relationships`,
    `${keyword}: What You Need to Know in 2025`
  ];
  
  const randomIndex = Math.floor(Math.random() * titleTemplates.length);
  return titleTemplates[randomIndex].charAt(0).toUpperCase() + titleTemplates[randomIndex].slice(1);
}

// Generate a mock blog post with the supplied keyword
async function generateMockBlogPost(keyword) {
  console.log(`Generating mock blog post for keyword: ${keyword}`);
  
  // Select a template or generate title based on keyword
  let template;
  let title;
  
  if (Math.random() > 0.5) {
    // Use an existing template
    template = getRandomTemplate();
    title = template.title;
  } else {
    // Generate a title based on the keyword
    title = generateTitle(keyword);
    // Use a random template for content
    template = getRandomTemplate();
  }
  
  // Generate a slug from the title
  const slug = slugify(title.toLowerCase());
  
  // Current date in ISO format
  const currentDate = new Date().toISOString().slice(0, 10);
  
  // Generate a description
  const description = template.description || 
    `Discover the best strategies and expert advice about ${keyword}. This comprehensive guide will help you understand the psychology and practical steps to improve your relationship.`;
  
  // Insert the keyword into the content a few times for SEO
  let content = template.content;
  
  // Add tags related to the keyword
  const tags = generateTags(keyword);
  
  return {
    title,
    slug,
    content,
    description,
    keyword,
    date: currentDate,
    tags,
    images: [], // Mock images will be empty since we're not downloading real ones
    html: createHtmlFromMarkdown(content, {
      title,
      description,
      date: currentDate,
      slug,
      keyword,
      tags
    })
  };
}

// Generate mock tags from a keyword
function generateTags(keyword) {
  const commonTags = ['Relationships', 'Dating', 'Psychology', 'Communication', 'Love', 'Attachment', 'Attraction'];
  
  // Select 2-4 random tags from common tags
  const selectedTags = [];
  const numTags = Math.floor(Math.random() * 3) + 2; // 2-4 tags
  
  for (let i = 0; i < numTags; i++) {
    const randomIndex = Math.floor(Math.random() * commonTags.length);
    const tag = commonTags[randomIndex];
    
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
  }
  
  return selectedTags;
}

// Convert markdown to HTML
function createHtmlFromMarkdown(markdown, metadata) {
  const converter = new showdown.Converter({
    tables: true,
    strikethrough: true,
    tasklists: true,
    smoothLivePreview: true,
    smartIndentationFix: true
  });
  
  const htmlContent = converter.makeHtml(markdown);
  
  // Simplified HTML template
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title} | Obsession Trigger</title>
  <meta name="description" content="${metadata.description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://obsession-trigger.com/posts/${metadata.slug}.html">
  <meta property="og:title" content="${metadata.title}">
  <meta property="og:description" content="${metadata.description}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://obsession-trigger.com/posts/${metadata.slug}.html">
  <meta property="twitter:title" content="${metadata.title}">
  <meta property="twitter:description" content="${metadata.description}">
  
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
          <li><a href="https://obsession-trigger.com/quiz" target="_blank">Take the Quiz</a></li>
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
      <h1 class="post-title">${metadata.title}</h1>
      <div class="post-meta-header">
        <time datetime="${metadata.date}">${new Date(metadata.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time> · 8 min read
      </div>
      <div class="tags">
        ${metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  </header>
  
  <!-- Post Content -->
  <main class="post-content">
    ${htmlContent}
    
    <div class="post-footer">
      <div class="post-cta">
        <h3>Discover Your Relationship Potential</h3>
        <p>Ready to transform your relationship? Take our free quiz to receive personalized insights and strategies tailored specifically to your situation.</p>
        <a href="https://obsession-trigger.com/quiz" class="btn btn-primary">Take the Quiz Now</a>
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
            <li><a href="https://obsession-trigger.com/quiz">Quiz</a></li>
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
</html>
  `;
}

// Save mock blog post to the filesystem
async function saveMockBlogPost(blogData) {
  try {
    const postsDir = path.join(process.cwd(), 'public', 'posts');
    
    // Ensure the posts directory exists
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }
    
    // Write the HTML file
    const filePath = path.join(postsDir, `${blogData.slug}.html`);
    fs.writeFileSync(filePath, blogData.html);
    
    return {
      success: true,
      path: filePath
    };
  } catch (error) {
    console.error('Error saving mock blog post:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateMockBlogPost,
  saveMockBlogPost
};
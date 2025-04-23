/**
 * Script to deploy the blog system on Replit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to create
const dirs = [
  path.join(__dirname, 'public', 'posts'),
  path.join(__dirname, 'public', 'images'),
  path.join(__dirname, 'public', 'css'),
  path.join(__dirname, 'public', 'js'),
  path.join(__dirname, 'data')
];

// Create necessary directories
function createDirectories() {
  console.log('Creating blog directories...');
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    } else {
      console.log(`✓ Directory exists: ${dir}`);
    }
  }
}

// Check if the keywords file exists in the attached_assets directory
function setupKeywords() {
  console.log('Setting up keyword system...');
  
  const keywordsPath = path.join(__dirname, 'data', 'keywords.json');
  const keywordsTextPath = path.join(__dirname, '..', 'attached_assets', 'keyword.txt');
  
  if (fs.existsSync(keywordsTextPath)) {
    console.log('✓ Keywords file found');
    
    // Read keywords file and create keywords.json
    const keywordsContent = fs.readFileSync(keywordsTextPath, 'utf8');
    const keywords = keywordsContent
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    console.log(`✓ Found ${keywords.length} keywords`);
    
    const keywordsData = {
      keywords,
      usedKeywords: []
    };
    
    fs.writeFileSync(keywordsPath, JSON.stringify(keywordsData, null, 2));
    console.log('✓ Keywords file processed and saved');
    
    return true;
  } else {
    console.error('❌ Keywords file not found. Create a file at "attached_assets/keyword.txt" with one keyword per line.');
    return false;
  }
}

// Generate demo blog posts
function generateDemoPosts() {
  console.log('Generating demo blog posts...');
  
  try {
    const demoGenerator = require('./demo-generator.cjs');
    
    // Generate 3 posts with different keywords
    const keywords = [
      'make him want you more',
      'create emotional intimacy',
      'trigger his hero instinct'
    ];
    
    for (const keyword of keywords) {
      console.log(`Generating post for keyword: ${keyword}`);
      const post = demoGenerator.generateBlogPost(keyword);
      demoGenerator.saveBlogPost(post);
      console.log(`✓ Generated post: ${post.title}`);
    }
    
    console.log('✓ Demo posts generated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error generating demo posts:', error.message);
    return false;
  }
}

// Configure the server to auto-start
function configureServer() {
  console.log('Configuring blog server...');
  
  try {
    // Create a simple script to start the server
    const startScript = `
#!/bin/bash
# Start the blog server
cd "$(dirname "$0")"
node server.js
`;
    
    const startScriptPath = path.join(__dirname, 'start-blog.sh');
    fs.writeFileSync(startScriptPath, startScript);
    execSync(`chmod +x ${startScriptPath}`);
    
    console.log('✓ Blog server startup script created');
    return true;
  } catch (error) {
    console.error('❌ Error configuring server:', error.message);
    return false;
  }
}

// Deploy the blog system
function deploy() {
  console.log('===== DEPLOYING BLOG SYSTEM ON REPLIT =====');
  
  // Create directories
  createDirectories();
  
  // Set up keyword system
  const keywordsSetup = setupKeywords();
  if (!keywordsSetup) {
    console.error('❌ Deployment failed: Keywords setup failed');
    return false;
  }
  
  // Generate demo posts
  const postsGenerated = generateDemoPosts();
  if (!postsGenerated) {
    console.error('❌ Deployment failed: Demo post generation failed');
    return false;
  }
  
  // Configure server
  const serverConfigured = configureServer();
  if (!serverConfigured) {
    console.error('❌ Deployment failed: Server configuration failed');
    return false;
  }
  
  console.log('✓ Blog system deployed successfully on Replit');
  console.log('✓ To start the blog server: cd blog && ./start-blog.sh');
  console.log('✓ The blog will be available at: https://[your-repl-name].[your-username].repl.co');
  
  console.log('\n===== DEPLOYMENT COMPLETE =====');
  return true;
}

// Run deployment
deploy();
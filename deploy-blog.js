/**
 * Script to deploy the blog
 * - Creates necessary directories
 * - Sets up default blog pages
 * - Starts the server
 */
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const BLOG_DIR = './blog';
const PUBLIC_DIR = path.join(BLOG_DIR, 'public');
const DATA_DIR = path.join(BLOG_DIR, 'data');
const POSTS_DIR = path.join(PUBLIC_DIR, 'posts');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const CSS_DIR = path.join(PUBLIC_DIR, 'css');
const JS_DIR = path.join(PUBLIC_DIR, 'js');

async function setupDirectories() {
  console.log('Setting up blog directories...');
  
  const dirs = [
    DATA_DIR,
    POSTS_DIR,
    IMAGES_DIR,
    CSS_DIR,
    JS_DIR
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`Error creating directory ${dir}:`, error);
      } else {
        console.log(`✓ Directory already exists: ${dir}`);
      }
    }
  }
}

async function validateKeywordsFile() {
  const keywordsPath = path.join(DATA_DIR, 'keywords.json');
  const keywordsFilePath = path.join('./attached_assets', 'keyword.txt');
  
  try {
    // Check if keywords.txt exists
    await fs.access(keywordsFilePath);
    console.log('✓ Keywords file found');
    
    // Copy keywords file to data directory
    const keywordsContent = await fs.readFile(keywordsFilePath, 'utf8');
    const keywords = keywordsContent
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    console.log(`✓ Found ${keywords.length} keywords`);
    
    // Create keywords.json
    const keywordsData = {
      keywords,
      usedKeywords: []
    };
    
    await fs.writeFile(keywordsPath, JSON.stringify(keywordsData, null, 2));
    console.log('✓ Keywords file copied to data directory');
    
    return true;
  } catch (error) {
    console.error('Error with keywords file:', error.message);
    return false;
  }
}

async function validateApiKeys() {
  const requiredKeys = ['OPENAI_API_KEY', 'PEXELS_API_KEY'];
  const missingKeys = [];
  
  for (const key of requiredKeys) {
    if (!process.env[key]) {
      missingKeys.push(key);
    }
  }
  
  if (missingKeys.length > 0) {
    console.error('❌ Missing required API keys:', missingKeys.join(', '));
    return false;
  }
  
  console.log('✓ All required API keys are present');
  return true;
}

async function startBlogServer() {
  try {
    console.log('Starting blog server...');
    execSync('node blog/server.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error starting blog server:', error.message);
  }
}

async function deploy() {
  console.log('===== DEPLOYING BLOG SYSTEM =====');
  
  // Setup directories
  await setupDirectories();
  
  // Validate keywords file
  const keywordsValid = await validateKeywordsFile();
  if (!keywordsValid) {
    console.error('❌ Deployment failed: Keywords file validation failed');
    return;
  }
  
  // Validate API keys
  const apiKeysValid = await validateApiKeys();
  if (!apiKeysValid) {
    console.error('❌ Deployment failed: API keys validation failed');
    return;
  }
  
  console.log('✓ Blog system is ready for deployment');
  console.log('✓ To start the blog server, run: node blog/server.js');
  console.log('✓ To generate a blog post, run: node blog/scripts/generate-post.js');
  
  console.log('\n===== DEPLOYMENT SUCCESSFUL =====');
}

// Run deployment
deploy();
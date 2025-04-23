/**
 * Keywords for blog post generation
 * These will be used to generate blog posts on relationships and attraction
 * Keywords are loaded from a file in the data directory
 */

// Module dependencies
const fs = require('fs-extra');
const path = require('path');

// Path to the keywords file
const keywordsFilePath = path.join(__dirname, '../data/keywords.txt');

// This variable will store our keywords after they're loaded from the file
let keywords = [];

// Function to load keywords from file
async function loadKeywordsFromFile() {
  try {
    // Check if keywords file exists
    if (await fs.pathExists(keywordsFilePath)) {
      // Read the file content
      const content = await fs.readFile(keywordsFilePath, 'utf8');
      
      // Split by newlines, filter out empty lines and trim whitespace
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      // Update the keywords array
      keywords = [...lines];
      
      console.log(`Loaded ${keywords.length} keywords from file`);
    } else {
      console.error('Keywords file not found:', keywordsFilePath);
      // Fallback to some default keywords if file not found
      keywords = [
        "how to make him obsessed with you",
        "how to trigger attraction in men",
        "signs he is secretly attracted to you",
        "how to make him chase you",
        "psychological triggers that make men fall in love"
      ];
    }
  } catch (error) {
    console.error('Error loading keywords from file:', error);
    // Fallback to some default keywords if error occurs
    keywords = [
      "how to make him obsessed with you",
      "how to trigger attraction in men",
      "signs he is secretly attracted to you",
      "how to make him chase you",
      "psychological triggers that make men fall in love"
    ];
  }
}

// Track which keywords have been used
let usedKeywords = [];

const usedKeywordsPath = path.join(__dirname, '../data/used-keywords.json');

// Initialize the used keywords tracking
async function initializeKeywordTracking() {
  try {
    // First, make sure the data directory exists
    await fs.ensureDir(path.dirname(usedKeywordsPath));
    
    // Load the keywords from file
    await loadKeywordsFromFile();
    
    // Load the used keywords
    if (await fs.pathExists(usedKeywordsPath)) {
      const data = await fs.readJson(usedKeywordsPath);
      usedKeywords = data.usedKeywords || [];
      
      // If all keywords have been used, reset the tracking
      if (usedKeywords.length >= keywords.length) {
        console.log('All keywords have been used, resetting tracking');
        usedKeywords = [];
        await saveUsedKeywords();
      }
    } else {
      // Create the file if it doesn't exist
      await fs.writeJson(usedKeywordsPath, { usedKeywords: [] });
    }
    
    console.log(`Keyword system initialized with ${keywords.length} total keywords and ${usedKeywords.length} used keywords`);
  } catch (error) {
    console.error('Error initializing keyword tracking:', error);
    // If there's an error, initialize with an empty array
    usedKeywords = [];
  }
}

// Save the list of used keywords
async function saveUsedKeywords() {
  try {
    await fs.writeJson(usedKeywordsPath, { usedKeywords });
  } catch (error) {
    console.error('Error saving used keywords:', error);
  }
}

// Get a list of unused keywords
function getUnusedKeywords() {
  return keywords.filter(keyword => !usedKeywords.includes(keyword));
}

// Get a random unused keyword
function getRandomUnusedKeyword() {
  const unusedKeywords = getUnusedKeywords();
  
  if (unusedKeywords.length === 0) {
    // If all keywords have been used, reset the used list
    usedKeywords = [];
    return keywords[Math.floor(Math.random() * keywords.length)];
  }
  
  return unusedKeywords[Math.floor(Math.random() * unusedKeywords.length)];
}

// Mark a keyword as used
async function markKeywordAsUsed(keyword) {
  if (!usedKeywords.includes(keyword)) {
    usedKeywords.push(keyword);
    await saveUsedKeywords();
  }
}

module.exports = {
  keywords,
  loadKeywordsFromFile,
  initializeKeywordTracking,
  getUnusedKeywords,
  getRandomUnusedKeyword,
  markKeywordAsUsed
};
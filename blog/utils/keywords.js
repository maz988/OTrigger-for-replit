/**
 * Keywords for blog post generation
 * These will be used to generate blog posts on relationships and attraction
 */

// List of keywords for generating blog posts
const keywords = [
  // Attraction topics
  "how to make him obsessed with you",
  "how to trigger attraction in men",
  "signs he is secretly attracted to you",
  "how to make him chase you",
  "psychological triggers that make men fall in love",
  "how to make him miss you",
  "attraction triggers for men",
  "how to create an emotional connection with a man",
  "what makes a man fall deeply in love",
  "how to be more attractive to men",
  
  // Relationship topics
  "how to fix a relationship that's falling apart",
  "signs he wants to commit to you",
  "how to communicate better with your partner",
  "rebuilding trust after betrayal",
  "handling relationship anxiety",
  "how to make a relationship last",
  "signs of a healthy relationship",
  "overcoming jealousy in relationships",
  "how to know if he's the one",
  "balancing independence and togetherness",
  
  // Dating topics
  "first date conversation starters",
  "how to tell if your date is going well",
  "dating red flags to watch for",
  "how to keep him interested after the first date",
  "texting rules for modern dating",
  "how to flirt effectively",
  "dating after divorce",
  "how to navigate online dating",
  "questions to ask before committing",
  "how to be authentic while dating",
  
  // Self-improvement topics
  "building self-confidence in relationships",
  "healing from past relationship trauma",
  "setting healthy boundaries with men",
  "embracing your feminine energy",
  "how to stop overthinking in relationships",
  "developing emotional intelligence",
  "loving yourself before loving someone else",
  "breaking toxic relationship patterns",
  "finding your worth outside of relationships",
  "overcoming fear of abandonment",
  
  // Long-term relationship topics
  "keeping the spark alive in long-term relationships",
  "navigating different life stages together",
  "coping with relationship boredom",
  "supporting your partner through difficult times",
  "growing together vs growing apart",
  "secrets of couples who stay in love",
  "maintaining independence while being a couple",
  "resolving conflicts without damaging the relationship",
  "signs your relationship is worth fighting for",
  "strengthening emotional intimacy"
];

// Track which keywords have been used
let usedKeywords = [];

// Load used keywords from a file if it exists
const fs = require('fs-extra');
const path = require('path');

const usedKeywordsPath = path.join(__dirname, '../data/used-keywords.json');

// Initialize the used keywords tracking
async function initializeKeywordTracking() {
  try {
    await fs.ensureDir(path.dirname(usedKeywordsPath));
    
    if (await fs.pathExists(usedKeywordsPath)) {
      const data = await fs.readJson(usedKeywordsPath);
      usedKeywords = data.usedKeywords || [];
    } else {
      // Create the file if it doesn't exist
      await fs.writeJson(usedKeywordsPath, { usedKeywords: [] });
    }
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
  initializeKeywordTracking,
  getUnusedKeywords,
  getRandomUnusedKeyword,
  markKeywordAsUsed
};
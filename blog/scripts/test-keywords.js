/**
 * Script to test keyword loading from file
 * Usage: node scripts/test-keywords.js
 */

const path = require('path');
const { 
  initializeKeywordTracking, 
  getUnusedKeywords, 
  getRandomUnusedKeyword, 
  markKeywordAsUsed 
} = require('../utils/keywords');

async function main() {
  try {
    console.log('Testing keyword loading functionality...');
    
    // Initialize keyword tracking (which includes loading from file)
    await initializeKeywordTracking();
    
    // Get all unused keywords
    const unusedKeywords = getUnusedKeywords();
    console.log(`Total unused keywords available: ${unusedKeywords.length}`);
    
    // Display the first 5 keywords
    console.log('\nFirst 5 keywords:');
    unusedKeywords.slice(0, 5).forEach((keyword, index) => {
      console.log(`${index + 1}. ${keyword}`);
    });
    
    // Get a random keyword and mark it as used
    const randomKeyword = getRandomUnusedKeyword();
    console.log(`\nRandomly selected keyword: "${randomKeyword}"`);
    
    // Mark the keyword as used
    await markKeywordAsUsed(randomKeyword);
    console.log(`Marked "${randomKeyword}" as used`);
    
    // Check if the keyword is no longer in the unused list
    const updatedUnusedKeywords = getUnusedKeywords();
    const isStillUnused = updatedUnusedKeywords.includes(randomKeyword);
    console.log(`Is the keyword still in unused list? ${isStillUnused ? 'Yes (ERROR)' : 'No (CORRECT)'}`);
    
    // Get another random keyword to verify rotation
    const anotherRandomKeyword = getRandomUnusedKeyword();
    console.log(`\nAnother randomly selected keyword: "${anotherRandomKeyword}"`);
    
    console.log('\nKeyword system test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error testing keyword system:', error);
    process.exit(1);
  }
}

// Run the script
main();
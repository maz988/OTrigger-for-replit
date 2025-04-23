const { createClient } = require('pexels');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Pexels client
const pexelsClient = createClient(process.env.PEXELS_API_KEY);

/**
 * Search for images on Pexels using keywords
 * @param {string} keyword - The search term
 * @param {number} count - Number of images to fetch
 * @returns {Array} Array of image objects
 */
async function searchImages(keyword, count = 2) {
  try {
    console.log(`Searching for ${count} images with keyword: ${keyword}`);
    const response = await pexelsClient.photos.search({ 
      query: keyword, 
      per_page: count,
      orientation: 'landscape'
    });
    
    if (response.photos.length === 0) {
      console.warn(`No images found for keyword: ${keyword}`);
      // Try a more generic search if specific keyword returns no results
      const fallbackResponse = await pexelsClient.photos.search({ 
        query: 'relationship couple', 
        per_page: count,
        orientation: 'landscape'
      });
      return fallbackResponse.photos;
    }
    
    return response.photos;
  } catch (error) {
    console.error('Error searching for images:', error);
    return [];
  }
}

/**
 * Download images and save to the public folder
 * @param {Array} images - Array of image objects from Pexels
 * @param {string} slug - The blog post slug for naming
 * @returns {Array} Array of local image paths and metadata
 */
async function downloadImages(images, slug) {
  const imageFolder = path.join(__dirname, '../public/images');
  
  // Ensure the image directory exists
  await fs.ensureDir(imageFolder);
  
  const imageResults = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const extension = image.src.original.split('.').pop().split('?')[0];
    const imageName = `${slug}-image-${i+1}.${extension}`;
    const imagePath = path.join(imageFolder, imageName);
    const imageUrl = image.src.large; // Use large size for good quality without excessive size
    
    try {
      // Download the image
      const response = await fetch(imageUrl);
      const buffer = await response.buffer();
      await fs.writeFile(imagePath, buffer);
      
      // Add to results
      imageResults.push({
        originalUrl: image.src.original,
        localPath: `/images/${imageName}`,
        width: image.width,
        height: image.height,
        photographer: image.photographer,
        photographerUrl: image.photographer_url,
        alt: `Image related to ${slug.replace(/-/g, ' ')}`,
        attribution: `Photo by ${image.photographer} on Pexels`
      });
      
      console.log(`Downloaded image: ${imageName}`);
    } catch (error) {
      console.error(`Error downloading image ${i+1} for ${slug}:`, error);
    }
  }
  
  return imageResults;
}

module.exports = {
  searchImages,
  downloadImages
};
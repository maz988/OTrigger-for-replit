/**
 * Tracking utilities for the blog-to-quiz integration
 */

/**
 * Generate tracking parameters for blog-to-quiz links
 * 
 * @param {Object} blogData - Data about the blog post
 * @param {string} blogData.title - Blog post title
 * @param {string} blogData.keyword - Blog post keyword
 * @param {string} blogData.slug - Blog post slug
 * @returns {string} URL parameters string with UTM tracking
 */
function generateTrackingParams(blogData) {
  const params = new URLSearchParams();
  params.set('utm_source', 'blog');
  params.set('utm_medium', 'content');
  params.set('utm_campaign', 'relationship_advice');
  params.set('utm_content', blogData.slug);
  params.set('utm_term', blogData.keyword);
  
  return params.toString();
}

/**
 * Generate a fully qualified quiz URL with tracking parameters
 * 
 * @param {string} quizBaseUrl - Base URL of the quiz application
 * @param {Object} blogData - Data about the blog post
 * @returns {string} Full quiz URL with tracking
 */
function getQuizUrl(quizBaseUrl = 'https://obsession-trigger.com/quiz', blogData) {
  if (!blogData) {
    return quizBaseUrl;
  }
  
  const trackingParams = generateTrackingParams(blogData);
  return `${quizBaseUrl}?${trackingParams}`;
}

module.exports = {
  generateTrackingParams,
  getQuizUrl
};
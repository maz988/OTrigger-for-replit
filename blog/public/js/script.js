/**
 * Main JavaScript file for Obsession Trigger Blog
 */

document.addEventListener('DOMContentLoaded', function() {
  // Mobile navigation toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('nav ul');
  
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }
  
  // Newsletter form submission
  const newsletterForm = document.querySelector('.newsletter-form');
  
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (email) {
        // In a real implementation, this would send the email to a server
        alert('Thank you for subscribing! We\'ll send relationship tips to ' + email);
        emailInput.value = '';
      }
    });
  }
  
  // Lazy loading images
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(function(img) {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without IntersectionObserver support
    lazyImages.forEach(function(img) {
      img.src = img.dataset.src;
    });
  }
  
  // Add click tracking for quiz CTA buttons
  const quizButtons = document.querySelectorAll('.cta-button, .cta-button-large, .nav-cta');
  
  quizButtons.forEach(function(button) {
    button.addEventListener('click', function(e) {
      // In a real implementation, this would track the click
      console.log('Quiz CTA clicked:', e.target.textContent);
      
      // Optional: Add analytics tracking code here
      // Example: gtag('event', 'click', { 'event_category': 'CTA', 'event_label': 'Quiz Button' });
    });
  });
});
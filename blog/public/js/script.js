/**
 * Obsession Trigger Blog JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const menu = document.querySelector('.menu');
  
  if (mobileMenuBtn && menu) {
    mobileMenuBtn.addEventListener('click', function() {
      menu.classList.toggle('active');
      
      // Change icon based on menu state
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        if (menu.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-times');
        } else {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });
  }
  
  // Newsletter subscription form
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (!email || !isValidEmail(email)) {
        showFormMessage(newsletterForm, 'Please enter a valid email address', 'error');
        return;
      }
      
      // In a real implementation, this would send the email to a server
      // For now, just show a success message
      showFormMessage(newsletterForm, 'Thank you for subscribing!', 'success');
      emailInput.value = '';
    });
  }
  
  // Share buttons
  const shareButtons = document.querySelectorAll('.share-button');
  if (shareButtons.length > 0) {
    shareButtons.forEach(button => {
      button.addEventListener('click', function() {
        const type = this.dataset.type;
        const title = document.querySelector('.post-title').textContent;
        const url = window.location.href;
        
        let shareUrl;
        
        switch(type) {
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
            break;
          case 'pinterest':
            const image = document.querySelector('.post-content img');
            const imageUrl = image ? image.src : '';
            shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(title)}`;
            break;
        }
        
        if (shareUrl) {
          window.open(shareUrl, 'share-popup', 'height=600,width=600');
        }
      });
    });
  }
  
  // Helper function to validate email
  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
  
  // Helper function to show form messages
  function showFormMessage(form, message, type) {
    let messageDiv = form.querySelector('.form-message');
    
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.className = 'form-message';
      form.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
    messageDiv.className = `form-message message-${type}`;
    
    // Remove the message after 3 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }
  
  // Lazy load images
  const lazyImages = document.querySelectorAll('img[data-src]');
  if (lazyImages.length > 0) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
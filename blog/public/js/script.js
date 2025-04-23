/**
 * Main JavaScript file for Obsession Trigger Blog
 */

// Handle newsletter form submission
document.addEventListener('DOMContentLoaded', function() {
  const newsletterForms = document.querySelectorAll('.newsletter-form');
  
  newsletterForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (!email) {
        showFormMessage(form, 'Please enter your email address', 'error');
        return;
      }
      
      // Here you would typically send this to your server
      // For now, just show a success message
      emailInput.value = '';
      showFormMessage(form, 'Thanks for subscribing!', 'success');
      
      // In a real implementation, you'd make an API call like:
      /*
      fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })
      .then(response => response.json())
      .then(data => {
        emailInput.value = '';
        showFormMessage(form, 'Thanks for subscribing!', 'success');
      })
      .catch(error => {
        showFormMessage(form, 'Failed to subscribe. Please try again.', 'error');
      });
      */
    });
  });
  
  // Handle mobile navigation toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('nav ul');
  
  if (navToggle) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }
});

// Function to show form submission messages
function showFormMessage(form, message, type) {
  let messageElement = form.querySelector('.form-message');
  
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.className = 'form-message';
    form.appendChild(messageElement);
  }
  
  messageElement.textContent = message;
  messageElement.className = `form-message ${type}`;
  
  // Remove the message after 3 seconds
  setTimeout(() => {
    messageElement.textContent = '';
    messageElement.className = 'form-message';
  }, 3000);
}

// Add reading progress indicator for blog posts
if (document.querySelector('.single-post')) {
  window.addEventListener('scroll', function() {
    const article = document.querySelector('.post-content');
    if (!article) return;
    
    const windowHeight = window.innerHeight;
    const fullHeight = article.offsetHeight;
    const scrolled = window.scrollY - article.offsetTop;
    
    let percent = Math.min(100, Math.max(0, (scrolled / (fullHeight - windowHeight)) * 100));
    
    // Create progress bar if it doesn't exist
    let progressBar = document.querySelector('.reading-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'reading-progress';
      document.body.appendChild(progressBar);
    }
    
    progressBar.style.width = `${percent}%`;
  });
}

// Handle lazy loading of images
if ('IntersectionObserver' in window) {
  const images = document.querySelectorAll('.lazy-image');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy-image');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => {
    imageObserver.observe(img);
  });
}

// Handle smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 100, // Offset for fixed header
        behavior: 'smooth'
      });
    }
  });
});
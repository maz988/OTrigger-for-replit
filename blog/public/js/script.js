// Main JavaScript file for Obsession Trigger Blog

document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const menu = document.querySelector('.menu');
  
  if (mobileMenuBtn && menu) {
    mobileMenuBtn.addEventListener('click', () => {
      menu.classList.toggle('active');
      
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
  
  // Newsletter form handling
  const newsletterForm = document.querySelector('.newsletter-form');
  
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = newsletterForm.querySelector('.newsletter-input');
      if (emailInput && emailInput.value) {
        showFormMessage(newsletterForm, 'Thank you for subscribing!', 'success');
        emailInput.value = '';
      } else {
        showFormMessage(newsletterForm, 'Please enter a valid email address', 'error');
      }
    });
  }
  
  // Share buttons on blog posts
  const shareButtons = document.querySelectorAll('.share-button');
  
  if (shareButtons.length > 0) {
    shareButtons.forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.type;
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        
        let shareUrl = '';
        
        switch (type) {
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
            break;
          case 'pinterest':
            const image = encodeURIComponent(document.querySelector('meta[property="og:image"]')?.content || '');
            shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${image}&description=${title}`;
            break;
        }
        
        if (shareUrl) {
          window.open(shareUrl, '_blank', 'width=600,height=400');
        }
      });
    });
  }
});

// Helper function to show form messages
function showFormMessage(form, message, type) {
  let messageEl = form.querySelector('.form-message');
  
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.className = 'form-message';
    form.appendChild(messageEl);
  }
  
  messageEl.textContent = message;
  messageEl.className = `form-message ${type}`;
  
  // Auto-remove the message after 3 seconds
  setTimeout(() => {
    messageEl.textContent = '';
    messageEl.className = 'form-message';
  }, 3000);
}
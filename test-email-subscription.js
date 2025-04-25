/**
 * Test script for verifying the email subscription functionality
 */

import fetch from 'node-fetch';

async function testSubscription() {
  try {
    console.log('Testing email subscription functionality...');
    
    // Test lead submission
    const leadResponse = await fetch('http://localhost:5000/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        source: 'test-script'
      })
    });
    
    if (!leadResponse.ok) {
      const error = await leadResponse.json();
      console.error('Lead submission failed:', error);
      return;
    }
    
    const leadResult = await leadResponse.json();
    console.log('Lead submission successful:', leadResult);
    
    // Test quiz lead conversion
    const quizResponse = await fetch('http://localhost:5000/api/quiz/lead-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quizResponseId: 123, // Use a dummy ID for testing
        firstName: 'Quiz',
        lastName: 'User',
        email: 'quiz@example.com',
        source: 'quiz'
      })
    });
    
    if (!quizResponse.ok) {
      const error = await quizResponse.json();
      console.error('Quiz lead conversion failed:', error);
      return;
    }
    
    const quizResult = await quizResponse.json();
    console.log('Quiz lead conversion successful:', quizResult);
    
    // Test blog lead conversion
    const blogResponse = await fetch('http://localhost:5000/api/blog/lead-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        blogPostId: 456, // Use a dummy ID for testing
        firstName: 'Blog',
        lastName: 'Reader',
        email: 'blog@example.com',
        source: 'blog'
      })
    });
    
    if (!blogResponse.ok) {
      const error = await blogResponse.json();
      console.error('Blog lead conversion failed:', error);
      return;
    }
    
    const blogResult = await blogResponse.json();
    console.log('Blog lead conversion successful:', blogResult);
    
    // Test lead magnet generation
    const leadMagnetResponse = await fetch('http://localhost:5000/api/generate-lead-magnet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Lead',
        lastName: 'Magnet',
        email: 'leadmagnet@example.com',
        leadMagnetName: 'Relationship Success Guide'
      })
    });
    
    if (!leadMagnetResponse.ok) {
      const error = await leadMagnetResponse.json();
      console.error('Lead magnet generation failed:', error);
      return;
    }
    
    const leadMagnetResult = await leadMagnetResponse.json();
    console.log('Lead magnet generation successful:', leadMagnetResult);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error testing email subscription:', error);
  }
}

testSubscription();
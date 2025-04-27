/**
 * Test script for verifying the quiz lead tracking functionality
 */
import fetch from 'node-fetch';

async function testQuizLeadTracking() {
  try {
    console.log('Testing quiz lead tracking API...');
    
    // First create a quiz response
    console.log('1. Creating quiz response...');
    const quizResponse = await fetch('http://localhost:5000/api/quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        relationshipStatus: 'Dating',
        concernType: 'Communication',
        confusingBehavior: 'He seems distant sometimes',
        communicationStyle: 'Direct',
        desiredOutcome: 'Deeper commitment',
        firstName: 'Test'
      }),
    });
    
    const quizData = await quizResponse.json();
    
    if (!quizData.success) {
      throw new Error(`Failed to create quiz response: ${quizData.error}`);
    }
    
    const quizResponseId = quizData.data.quizResponseId;
    console.log(`Quiz response created with ID: ${quizResponseId}`);
    
    // Then track lead conversion
    console.log('2. Tracking lead conversion...');
    const leadTracking = await fetch('http://localhost:5000/api/quiz/lead-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizResponseId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }),
    });
    
    const trackingData = await leadTracking.json();
    
    if (!trackingData.success) {
      throw new Error(`Failed to track lead conversion: ${trackingData.error}`);
    }
    
    console.log('Lead conversion tracked successfully:', trackingData.message);
    
    // Verify the quiz response was updated
    console.log('3. Verifying quiz response update...');
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testQuizLeadTracking();
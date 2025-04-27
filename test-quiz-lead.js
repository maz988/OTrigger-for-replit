/**
 * Test script for verifying the quiz lead tracking functionality
 */
import fetch from 'node-fetch';

async function testQuizLeadTracking() {
  try {
    console.log('======== TESTING QUIZ LEAD TRACKING API ========');
    console.log('\nTEST 1: Happy Path - Successfully track a lead\n');
    
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
    console.log('Test 1 completed successfully!');
    
    // Test invalid quiz response ID
    console.log('\nTEST 2: Edge Case - Non-existent quiz response ID\n');
    const nonExistentId = 99999;
    console.log(`Testing with non-existent quiz ID: ${nonExistentId}`);
    
    const invalidTracking = await fetch('http://localhost:5000/api/quiz/lead-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizResponseId: nonExistentId,
        email: 'test@example.com',
        firstName: 'Test'
      }),
    });
    
    const invalidTrackingData = await invalidTracking.json();
    
    // This should fail with a 404
    if (invalidTracking.status === 404 && !invalidTrackingData.success) {
      console.log('Correctly rejected non-existent quiz ID:', invalidTrackingData.error);
    } else {
      console.error('ERROR: Accepted invalid quiz ID when it should be rejected');
    }
    
    // Test missing required fields
    console.log('\nTEST 3: Edge Case - Missing required fields\n');
    console.log('Testing with missing email field');
    
    const missingFieldsTracking = await fetch('http://localhost:5000/api/quiz/lead-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizResponseId: quizResponseId,
        // Missing email field
        firstName: 'Test'
      }),
    });
    
    const missingFieldsData = await missingFieldsTracking.json();
    
    // This should fail with a 400
    if (missingFieldsTracking.status === 400 && !missingFieldsData.success) {
      console.log('Correctly rejected missing required fields:', missingFieldsData.error);
    } else {
      console.error('ERROR: Accepted missing required fields when they should be rejected');
    }
    
    console.log('\nAll tests completed!\n');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testQuizLeadTracking();
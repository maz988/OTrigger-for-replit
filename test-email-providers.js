/**
 * Test script for verifying email provider integrations
 * Tests all three supported email providers: SendGrid, MailerLite, and Brevo
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { storage } = require('./server/storage');

async function testEmailProvider(provider, apiKey) {
  console.log(`Testing ${provider} email provider...`);
  
  try {
    // Test the provider connection
    const testResponse = await fetch(`http://localhost:5000/api/admin/settings/test/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.ADMIN_SESSION_COOKIE || 'connect.sid=YOUR_SESSION_COOKIE'
      },
      body: JSON.stringify({ apiKey })
    });
    
    const testResult = await testResponse.json();
    
    if (testResult.success) {
      console.log(`✅ ${provider} connection test successful`);
      console.log(`   Message: ${testResult.message}`);
    } else {
      console.error(`❌ ${provider} connection test failed:`);
      console.error(`   Error: ${testResult.error}`);
      return false;
    }
    
    // Send a test email
    const testEmailResponse = await fetch('http://localhost:5000/api/admin/email/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.ADMIN_SESSION_COOKIE || 'connect.sid=YOUR_SESSION_COOKIE'
      },
      body: JSON.stringify({
        email: process.env.TEST_EMAIL || 'test@example.com',
        provider,
        apiKey
      })
    });
    
    const emailResult = await testEmailResponse.json();
    
    if (emailResult.success) {
      console.log(`✅ ${provider} test email sent successfully`);
      console.log(`   Message ID: ${emailResult.data.messageId}`);
      return true;
    } else {
      console.error(`❌ ${provider} test email failed:`);
      console.error(`   Error: ${emailResult.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error testing ${provider}: ${error.message}`);
    return false;
  }
}

async function testSubscriberImport(provider, apiKey) {
  console.log(`Testing subscriber import to ${provider}...`);
  
  try {
    // Create a test subscriber
    const testEmail = `test-${Date.now()}@obsessiontrigger.com`;
    
    const response = await fetch('http://localhost:5000/api/admin/email/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.ADMIN_SESSION_COOKIE || 'connect.sid=YOUR_SESSION_COOKIE'
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        source: 'test-script'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Test subscriber created: ${testEmail}`);
      
      // Now add to provider
      const importResponse = await fetch(`http://localhost:5000/api/email/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          name: 'Test User',
          source: 'test-script'
        })
      });
      
      const importResult = await importResponse.json();
      
      if (importResult.success) {
        console.log(`✅ Subscriber successfully sent to ${provider}`);
        return true;
      } else {
        console.error(`❌ Subscriber import to ${provider} failed:`);
        console.error(`   Error: ${importResult.error}`);
        return false;
      }
    } else {
      console.error(`❌ Failed to create test subscriber:`);
      console.error(`   Error: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error testing subscriber import: ${error.message}`);
    return false;
  }
}

async function testAllEmailProviders() {
  console.log('===== EMAIL PROVIDER INTEGRATION TEST =====');
  console.log('Testing all supported email providers...');
  
  // Test SendGrid
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey) {
    console.log('\n📧 TESTING SENDGRID:');
    const sendgridSuccess = await testEmailProvider('sendgrid', sendgridApiKey);
    if (sendgridSuccess) {
      await testSubscriberImport('sendgrid', sendgridApiKey);
    }
  } else {
    console.log('\n⚠️ SKIPPING SENDGRID: No API key found in environment');
  }
  
  // Test MailerLite
  const mailerliteApiKey = process.env.MAILERLITE_API_KEY;
  if (mailerliteApiKey) {
    console.log('\n📧 TESTING MAILERLITE:');
    const mailerliteSuccess = await testEmailProvider('mailerlite', mailerliteApiKey);
    if (mailerliteSuccess) {
      await testSubscriberImport('mailerlite', mailerliteApiKey);
    }
  } else {
    console.log('\n⚠️ SKIPPING MAILERLITE: No API key found in environment');
  }
  
  // Test Brevo
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    console.log('\n📧 TESTING BREVO:');
    const brevoSuccess = await testEmailProvider('brevo', brevoApiKey);
    if (brevoSuccess) {
      await testSubscriberImport('brevo', brevoApiKey);
    }
  } else {
    console.log('\n⚠️ SKIPPING BREVO: No API key found in environment');
  }
  
  console.log('\n===== TEST COMPLETE =====');
}

// Run the tests
testAllEmailProviders().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
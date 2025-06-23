#!/usr/bin/env node

/**
 * Debug script to help diagnose session issues
 * Run this script to test session functionality
 * 
 * Note: This script requires Node.js 18+ for built-in fetch support
 */

const BASE_URL = 'http://localhost:3000';

async function debugSession() {
  console.log('🔍 Starting session debug...\n');

  try {
    // Test 1: Check session state before login
    console.log('1. Checking session state before login...');
    const sessionBefore = await fetch(`${BASE_URL}/api/debug/session`);
    const sessionDataBefore = await sessionBefore.json();
    console.log('Session before login:', JSON.stringify(sessionDataBefore, null, 2));
    console.log('');

    // Test 2: Try to login with test credentials
    console.log('2. Attempting login...');
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });

    if (loginResponse.ok) {
      console.log('✅ Login successful');
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('Cookies received:', cookies);
    } else {
      console.log('❌ Login failed:', loginResponse.status, loginResponse.statusText);
      const errorData = await loginResponse.json();
      console.log('Error details:', errorData);
    }
    console.log('');

    // Test 3: Check session state after login attempt
    console.log('3. Checking session state after login attempt...');
    const sessionAfter = await fetch(`${BASE_URL}/api/debug/session`, {
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      }
    });
    const sessionDataAfter = await sessionAfter.json();
    console.log('Session after login:', JSON.stringify(sessionDataAfter, null, 2));
    console.log('');

    // Test 4: Try to access protected endpoint
    console.log('4. Testing protected endpoint access...');
    const userResponse = await fetch(`${BASE_URL}/api/user`, {
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      }
    });
    
    if (userResponse.ok) {
      console.log('✅ Protected endpoint accessible');
      const userData = await userResponse.json();
      console.log('User data:', JSON.stringify(userData, null, 2));
    } else {
      console.log('❌ Protected endpoint not accessible:', userResponse.status);
      const errorData = await userResponse.text();
      console.log('Error details:', errorData);
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

// Run the debug script
debugSession().then(() => {
  console.log('\n🏁 Debug session completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Debug session failed:', error);
  process.exit(1);
}); 
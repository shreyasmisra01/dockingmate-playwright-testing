#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test the live DockingMate site
async function testLiveSite() {
  console.log('🎭 Testing Live DockingMate Site');
  console.log('================================');
  
  const baseUrl = 'https://mooringmate.24yachtmate.com';
  
  try {
    // Test 1: Basic connectivity
    console.log('📍 Test 1: Basic Connectivity');
    const response = await makeRequest(baseUrl);
    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📏 Content Length: ${response.headers['content-length'] || 'Unknown'}`);
    console.log(`🏷️  Content Type: ${response.headers['content-type'] || 'Unknown'}`);
    console.log(`🕒 Last Modified: ${response.headers['last-modified'] || 'Unknown'}`);
    console.log();
    
    // Test 2: Check for React app
    console.log('⚛️  Test 2: React Application Detection');
    if (response.body.includes('react') || response.body.includes('React')) {
      console.log('✅ React application detected');
    } else {
      console.log('❓ React not explicitly detected in HTML');
    }
    console.log();
    
    // Test 3: Check for key elements
    console.log('🔍 Test 3: Key Elements Detection');
    const elements = [
      { name: 'Title Tag', pattern: /<title[^>]*>([^<]*)<\/title>/i },
      { name: 'Meta Description', pattern: /<meta[^>]*name=["\']description["\'][^>]*>/i },
      { name: 'Navigation', pattern: /<nav[^>]*>|<div[^>]*nav[^>]*>/i },
      { name: 'Login/Auth', pattern: /login|signin|sign.in|auth/i },
      { name: 'Footer', pattern: /<footer[^>]*>|<div[^>]*footer[^>]*>/i }
    ];
    
    elements.forEach(element => {
      if (element.pattern.test(response.body)) {
        console.log(`✅ ${element.name} found`);
      } else {
        console.log(`❌ ${element.name} not found`);
      }
    });
    console.log();
    
    // Test 4: Extract title if available
    const titleMatch = response.body.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) {
      console.log(`📋 Page Title: "${titleMatch[1].trim()}"`);
    }
    console.log();
    
    // Test 5: Check common endpoints
    console.log('🔗 Test 5: Common Endpoints');
    const endpoints = ['/login', '/signup', '/about', '/contact'];
    
    for (const endpoint of endpoints) {
      try {
        const endpointResponse = await makeRequest(baseUrl + endpoint);
        console.log(`✅ ${endpoint}: ${endpointResponse.statusCode}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    console.log();
    
    console.log('🎉 Live site connectivity test completed!');
    console.log('🚀 Ready for Playwright E2E testing once browsers are installed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Run the test
testLiveSite();
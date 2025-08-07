#!/usr/bin/env node

const { chromium } = require('playwright');

async function inspectLiveSite() {
  console.log('🔍 Inspecting Live DockingMate Site Structure');
  console.log('=============================================');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://mooringmate.24yachtmate.com', { waitUntil: 'networkidle' });
    
    // Get basic page info
    const title = await page.title();
    const url = page.url();
    console.log(`📄 Title: "${title}"`);
    console.log(`🌐 URL: ${url}`);
    console.log();
    
    // Check for common elements
    console.log('🧩 Element Analysis:');
    console.log('===================');
    
    // Navigation elements
    const navSelectors = [
      'nav', '.navbar', '.navigation', '.nav', '.header-nav',
      '[data-testid="navigation"]', '.menu', '.main-nav'
    ];
    
    for (const selector of navSelectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        console.log(`✅ Navigation found: ${selector}`);
        console.log(`   Text preview: ${text.substring(0, 100)}...`);
        break;
      }
    }
    
    // Button elements
    const buttonSelectors = [
      'button', '.btn', '.button', 'a[href*="login"]', 'a[href*="signup"]',
      '[data-testid*="login"]', '[data-testid*="signup"]'
    ];
    
    let foundButtons = [];
    for (const selector of buttonSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        for (const element of elements.slice(0, 3)) { // First 3 buttons
          const text = await element.textContent();
          const href = await element.getAttribute('href');
          if (text && text.trim()) {
            foundButtons.push({ selector, text: text.trim(), href });
          }
        }
      }
    }
    
    console.log(`✅ Found ${foundButtons.length} buttons/links:`);
    foundButtons.forEach(btn => {
      console.log(`   "${btn.text}" ${btn.href ? `(${btn.href})` : ''}`);
    });
    console.log();
    
    // Form elements
    const formSelectors = [
      'form', '.form', '.search-form', '.search', 'input[type="search"]',
      'input[placeholder*="search"]', 'input[placeholder*="location"]'
    ];
    
    for (const selector of formSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log(`✅ Form element found: ${selector}`);
      }
    }
    console.log();
    
    // Get all headings
    const headings = await page.$$eval('h1, h2, h3', elements => 
      elements.map(el => ({ tag: el.tagName, text: el.textContent.trim() }))
    );
    
    console.log('📋 Headings found:');
    headings.slice(0, 5).forEach(h => {
      console.log(`   ${h.tag}: "${h.text}"`);
    });
    console.log();
    
    // Get all links
    const links = await page.$$eval('a[href]', elements => 
      elements.map(el => ({ text: el.textContent.trim(), href: el.href }))
        .filter(link => link.text && link.href.startsWith('http'))
    );
    
    console.log('🔗 Important Links found:');
    links.slice(0, 8).forEach(link => {
      console.log(`   "${link.text}" -> ${link.href}`);
    });
    console.log();
    
    // Check meta description
    const metaDesc = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
    if (metaDesc) {
      console.log(`📝 Meta Description: "${metaDesc}"`);
    }
    
    // Get page HTML structure (first 1000 chars for analysis)
    const htmlContent = await page.content();
    console.log('\n📄 HTML Structure Preview:');
    console.log('==========================');
    console.log(htmlContent.substring(0, 1000) + '...\n');
    
  } catch (error) {
    console.error('❌ Error inspecting site:', error.message);
  } finally {
    await browser.close();
  }
}

inspectLiveSite();
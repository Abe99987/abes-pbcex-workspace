// Shop Navigation Test Script
// Run in browser console on /shop page

console.log('=== SHOP NAVIGATION TEST ===');

// 1. DOM Structure Check for Gold (first row)
const goldTitleLink = document.querySelector('[data-testid="row-title-link"]');
const goldThumbLink = document.querySelector('[data-testid="row-thumb-link"]');
const goldChartLink = document.querySelector('[data-testid="row-chart-link"]');

console.log('DOM Elements Found:');
console.log('Title Link:', goldTitleLink ? goldTitleLink.href : 'NOT FOUND');
console.log('Thumb Link:', goldThumbLink ? goldThumbLink.href : 'NOT FOUND');
console.log('Chart Link:', goldChartLink ? goldChartLink.href : 'NOT FOUND');

// 2. Action Button Links
const detailsBtn = document.querySelector('button[aria-label*="details"]');
const buyBtn = document.querySelector('button[aria-label*="Buy Gold"]');
const sellBtn = document.querySelector('button[aria-label*="Sell Gold"]');
const orderBtn = document.querySelector('button[aria-label*="Order Gold"]');

console.log('\nAction Buttons:');
console.log('Details Button:', detailsBtn ? 'FOUND' : 'NOT FOUND');
console.log('Buy Button:', buyBtn ? 'FOUND' : 'NOT FOUND');
console.log('Sell Button:', sellBtn ? 'FOUND' : 'NOT FOUND');
console.log('Order Button:', orderBtn ? 'FOUND' : 'NOT FOUND');

// 3. Pointer Events Check
if (goldChartLink) {
  const chartStyle = getComputedStyle(goldChartLink);
  console.log('\nChart Link Styles:');
  console.log('Pointer Events:', chartStyle.pointerEvents);
  console.log('Z-Index:', chartStyle.zIndex);
  console.log('Cursor:', chartStyle.cursor);
}

// 4. Click Simulation (commented out to avoid navigation during test)
console.log('\n=== CLICK SIMULATION READY ===');
console.log('Run these commands to test navigation:');
console.log('goldTitleLink.click(); // Should go to /shop/XAU');
console.log('goldThumbLink.click(); // Should go to /shop/XAU');  
console.log('goldChartLink.click(); // Should go to /shop/XAU');

// Uncomment to actually test:
// setTimeout(() => goldTitleLink.click(), 1000);
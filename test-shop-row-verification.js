// Shop Row Verification Script
// Run this in the browser console on /shop to test row interactions

console.log('=== SHOP ROW VERIFICATION ===');

// Check DOM elements exist
const cardLink = document.querySelector('[data-testid="row-card-link"]');
const tickerLink = document.querySelector('[data-testid="row-ticker-link"]');
const detailsButton = document.querySelector('button[aria-label*="View"][aria-label*="details"]');

console.log('DOM Elements:');
console.log('Row card link:', cardLink ? 'Found' : 'Missing', cardLink);
console.log('Ticker link:', tickerLink ? 'Found' : 'Missing', tickerLink);  
console.log('Details button:', detailsButton ? 'Found' : 'Missing', detailsButton);

if (cardLink) {
  console.log('Card link attributes:');
  console.log('- role:', cardLink.getAttribute('role'));
  console.log('- tabindex:', cardLink.getAttribute('tabindex'));
  console.log('- aria-label:', cardLink.getAttribute('aria-label'));
}

if (tickerLink) {
  console.log('Ticker link attributes:');
  console.log('- aria-label:', tickerLink.getAttribute('aria-label'));
  console.log('- data-testid:', tickerLink.getAttribute('data-testid'));
}

// Check for click blockers
const miniChart = document.querySelector('.pointer-events-none');
if (miniChart) {
  console.log('Mini chart pointer-events:', getComputedStyle(miniChart).pointerEvents);
  console.log('Mini chart z-index:', getComputedStyle(miniChart).zIndex);
}

// Simulate clicks (will navigate, so run one at a time)
console.log('\n=== CLICK SIMULATION ===');
console.log('Run these commands one at a time:');
console.log('1. Card click: document.querySelector("[data-testid=\\"row-card-link\\"]")?.click()');
console.log('2. Ticker click: document.querySelector("[data-testid=\\"row-ticker-link\\"]")?.click()');

// Function to test card click
window.testCardClick = function() {
  const card = document.querySelector('[data-testid="row-card-link"]');
  if (card) {
    console.log('Clicking card...');
    card.click();
    setTimeout(() => {
      console.log('After card click:', location.pathname + location.search);
    }, 200);
  }
};

// Function to test ticker click  
window.testTickerClick = function() {
  const ticker = document.querySelector('[data-testid="row-ticker-link"]');
  if (ticker) {
    console.log('Clicking ticker...');
    ticker.click();
    setTimeout(() => {
      console.log('After ticker click:', location.pathname + location.search);
    }, 200);
  }
};

console.log('\nQuick test functions available:');
console.log('- testCardClick()');
console.log('- testTickerClick()');
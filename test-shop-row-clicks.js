// Test script to verify shop row click behavior
// Run this in browser console on /shop page

console.log('=== SHOP ROW CLICK TEST ===');

// Check if we're on the shop page
if (!window.location.pathname.includes('/shop')) {
  console.error('Please navigate to /shop first');
} else {
  
  // DOM dump for Gold and Silver rows
  console.log('\n=== DOM DUMP FOR GOLD & SILVER ===');
  
  const goldRowLeft = document.querySelector('[data-testid="row-left-link"]');
  const goldTicker = document.querySelector('[data-testid="row-ticker-link"]');
  const detailsBtn = document.querySelector('button[aria-label*="Gold details"]');
  const buyBtn = document.querySelector('button[aria-label*="Buy Gold"]');
  const sellBtn = document.querySelector('button[aria-label*="Sell Gold"]');
  const orderBtn = document.querySelector('button[aria-label*="Order Gold"]');
  const sendBtn = document.querySelector('button[aria-label*="Send Gold"]');
  const depositBtn = document.querySelector('button[aria-label*="Deposit Gold"]');
  
  console.log('Gold Row Left Link:', goldRowLeft?.getAttribute('href'));
  console.log('Gold Ticker Link:', goldTicker?.getAttribute('href'));
  console.log('Details Button:', detailsBtn?.textContent);
  console.log('Buy Button:', buyBtn?.textContent);
  console.log('Sell Button:', sellBtn?.textContent);
  console.log('Order Button:', orderBtn?.textContent);
  console.log('Send Button:', sendBtn?.textContent);
  console.log('Deposit Button:', depositBtn?.textContent);
  
  // Check mini chart pointer events
  const miniChart = document.querySelector('.w-32.h-16.bg-muted');
  if (miniChart) {
    const style = window.getComputedStyle(miniChart);
    console.log('\nMini Chart Pointer Events:', style.pointerEvents);
    console.log('Mini Chart Z-Index:', style.zIndex);
  }
  
  // Simulate clicks
  console.log('\n=== CLICK SIMULATION ===');
  
  const originalLocation = window.location.href;
  
  console.log('Current location:', originalLocation);
  
  // Test row left click
  if (goldRowLeft) {
    console.log('Clicking Gold row left link...');
    goldRowLeft.click();
    setTimeout(() => {
      console.log('After row left click:', window.location.pathname + window.location.search);
      
      // Navigate back and test ticker click
      window.history.back();
      setTimeout(() => {
        if (goldTicker) {
          console.log('Clicking Gold ticker link...');
          goldTicker.click();
          setTimeout(() => {
            console.log('After ticker click:', window.location.pathname + window.location.search);
          }, 100);
        }
      }, 500);
    }, 100);
  }
}

console.log('=== TEST COMPLETE ===');
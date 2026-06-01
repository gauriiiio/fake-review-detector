console.log("Content script loaded on:", window.location.hostname);

function scrapeAmazonReviews() {
    const reviews = [];
    const reviewElements = document.querySelectorAll('[data-hook="review"]');
    console.log("Found review elements:", reviewElements.length);
  
    reviewElements.forEach(el => {
      const textEl = el.querySelector('[data-hook="reviewRichContentContainer"]') || 
                     el.querySelector('[data-hook="review-body"]');
      const ratingEl = el.querySelector('[data-hook="review-star-rating"]');
  
      if (textEl) {
        const text = textEl.innerText.trim();
        const ratingText = ratingEl ? ratingEl.querySelector('.a-icon-alt')?.innerText : "3 out of 5";
        const rating = parseFloat(ratingText?.split(" ")[0]) || 3.0;
  
        if (text.length > 0) {
          reviews.push({ text, rating });
        }
      }
    });
  
    console.log("Scraped reviews:", reviews.length);
    return reviews;
  }

function scrapeFlipkartReviews() {
  const reviews = [];
  const reviewElements = document.querySelectorAll('div[class*="col EPCmJX"]');
  
  reviewElements.forEach(el => {
    const textEl = el.querySelector('div[class*="ZmyHeo"]');
    const ratingEl = el.querySelector('div[class*="XQDdHH"]');
    
    if (textEl) {
      const text = textEl.innerText.trim();
      const rating = ratingEl ? parseFloat(ratingEl.innerText) || 3.0 : 3.0;
      
      if (text.length > 0) {
        reviews.push({ text, rating });
      }
    }
  });
  
  return reviews;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  if (request.action === "scrape") {
    let reviews = [];
    
    if (window.location.hostname.includes("amazon")) {
      reviews = scrapeAmazonReviews();
    } else if (window.location.hostname.includes("flipkart")) {
      reviews = scrapeFlipkartReviews();
    }
    
    console.log("Sending back reviews:", reviews.length);
    sendResponse({ reviews });
  }
  return true;
});
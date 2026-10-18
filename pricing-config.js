/**
 * PRICING CONFIGURATION - Delta Zone System
 * 
 * All prices are set here in one place for easy editing.
 * Update these values to change prices across the entire site.
 * 
 * NOTE: The 4-Week Foundation Program Stripe checkout price must also be 
 * updated in your Stripe dashboard to match the price below.
 */

const PRICING = {
  // 4-Week Foundation Program (one-time purchase)
  foundationProgram: {
    price: 39,
    currency: 'USD',
    display: '$39'
  },
  
  // 1-on-1 Coaching (monthly)
  coaching: {
    beginner: {
      price: 129,
      currency: 'USD',
      display: '$129/mo'
    },
    strengthPrep: {
      price: 149,
      currency: 'USD',
      display: '$149/mo'
    },
    racePrep: {
      price: 169,
      currency: 'USD',
      display: '$169/mo'
    },
    doubles: {
      price: 249,
      currency: 'USD',
      display: '$249/mo per pair',
      note: 'Price is for 2 athletes training together'
    },
    pro: {
      price: 199,
      currency: 'USD',
      display: '$199/mo'
    },
    elite: {
      price: 249,
      currency: 'USD',
      display: '$249/mo'
    }
  }
};

// Export for use in HTML pages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRICING;
}

// Test file for seller status formatting
// Run this in browser console to test the new functionality

import { formatSellerRating, formatSellerStatus } from './helpers.js';

console.log('Testing Seller Status Formatting\n');

// Test cases
const testCases = [
  { rating: 0, salesCount: 0, description: 'New seller with no sales' },
  { rating: 0, salesCount: 5, description: 'New seller with 5 sales' },
  { rating: 4.5, salesCount: 8, description: 'Seller with rating but less than 10 sales' },
  { rating: 4.2, salesCount: 10, description: 'Seller with 10 sales (threshold)' },
  { rating: 4.8, salesCount: 25, description: 'Experienced seller' },
  { rating: null, salesCount: null, description: 'Seller with null values' },
  { rating: undefined, salesCount: undefined, description: 'Seller with undefined values' },
];

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.description}`);
  console.log(`Input: rating=${testCase.rating}, salesCount=${testCase.salesCount}`);
  
  const ratingResult = formatSellerRating(testCase.rating, testCase.salesCount);
  console.log(`formatSellerRating result: "${ratingResult}"`);
  
  const statusResult = formatSellerStatus(testCase.rating, testCase.salesCount);
  console.log(`formatSellerStatus result:`, statusResult);
  console.log(`Display: "${statusResult.display}"`);
  console.log(`Is Starting: ${statusResult.isStarting}`);
  console.log(`Sales Count: ${statusResult.salesCount}`);
});

console.log('\nAll tests completed!');
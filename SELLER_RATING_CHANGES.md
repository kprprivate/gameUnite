# Seller Rating Display Changes

## Overview
Modified seller rating display logic to show "Iniciando" (Starting) for new sellers with less than 10 sales instead of showing "0.0 rating and 0 sales".

## Changes Made

### 1. New Helper Functions (utils/helpers.js)
Added two new utility functions:

- `formatSellerRating(rating, salesCount)`: Returns "Iniciando" for sellers with < 10 sales, otherwise returns the formatted rating
- `formatSellerStatus(rating, salesCount)`: Returns an object with display text, starting status flag, and sales count

### 2. Updated Components

#### AdDetails.jsx
- **Location**: Seller information section (lines 621-640)
- **Change**: Shows "Vendedor: Iniciando" for new sellers instead of "Avaliação: 0.0 (0 vendas)"
- **Visual**: New sellers get blue "Iniciando" text with optional sales count

#### UserProfile.jsx 
- **Location**: Public profile page, seller ratings section (lines 163-170)
- **Change**: Shows "Iniciando" in seller rating display for users with < 10 sales
- **Visual**: Consistent with other rating displays

#### Profile.jsx
- **Location**: User's own profile page, statistics header (line 174)
- **Change**: Shows "Iniciando" instead of "0.0/5" for new sellers
- **Visual**: Cleaner profile header display

#### OrderDetails.jsx
- **Location**: Other user information sidebar (lines 609-625)
- **Change**: Shows "Status: Iniciando" for new sellers in order details
- **Visual**: More user-friendly status indication

## Business Logic

- **Threshold**: 10 sales required to show actual rating
- **New Seller Display**: "Iniciando" (Portuguese for "Starting")
- **Color Coding**: Blue text for "Iniciando" status
- **Sales Count**: Still shows partial sales count when applicable (e.g., "Iniciando (3 vendas)")

## Testing

Use the test file `utils/test-seller-status.js` to verify the helper functions work correctly with various input scenarios.

## Files Modified

1. `/front/src/utils/helpers.js` - Added helper functions
2. `/front/src/pages/Ads/AdDetails.jsx` - Updated seller info display
3. `/front/src/pages/Users/UserProfile.jsx` - Updated public profile ratings
4. `/front/src/pages/Profile/Profile.jsx` - Updated personal profile display
5. `/front/src/pages/Orders/OrderDetails.jsx` - Updated order participant display

## Before/After Examples

### Before:
- "Avaliação: 0.0 (0 vendas)"
- "⭐ 0.0/5 - Vendedor"

### After:
- "Vendedor: **Iniciando**"
- "⭐ **Iniciando** - Vendedor"
- "Status: **Iniciando** (3 vendas)" (when some sales exist)

This change provides a more encouraging and professional appearance for new sellers on the platform.
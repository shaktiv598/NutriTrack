# NutriTrack UK

A calorie and nutrition tracking app for UK foods.

## Project Structure

```
/
├── index.html      — Main HTML shell
├── styles.css      — All styles (dark glass-morphism theme)
├── foods.js        — UK food database (419 items, nutritional data per 100g)
├── app.js          — All application logic
└── README.md       — This file
```

## Features

- **Diary** — Log meals with calorie ring, macro bars, daily totals
- **Search** — Instant search across 419 UK foods (offline, no API needed)
- **Barcode** — Camera scan + Open Food Facts API lookup (3M+ products)
- **Water** — Glass tracker with animated SVG glasses
- **Custom meals** — Add your own meal categories with emoji picker
- **7-day history** — Browse and edit past diary entries
- **Offline-first** — All data saved to localStorage on device

## Nutritional data tracked

Calories (kcal), Protein (g), Carbohydrates (g), Fat (g), Fibre (g), Iron (mg)

## Tech Stack

- Pure HTML/CSS/JavaScript — no framework, no build step
- ZXing (@zxing/library 0.18.6) — barcode scanning
- Open Food Facts API — barcode product lookup (world.openfoodfacts.org)
- DM Sans — Google Fonts
- localStorage — data persistence

## Publishing as a native app (Capacitor)

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "NutriTrack UK" "com.yourname.nutritrack"
mkdir www && cp index.html styles.css foods.js app.js www/
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios      # Build for App Store
npx cap open android  # Build for Play Store
```

## Design notes for customisation

### Colours (in styles.css and app.js)
- Background: `#0d0d1a` (near-black)
- Accent teal: `#4ECDC4`
- Accent purple: `#667eea`
- Calories ring: `#4ECDC4`
- Protein: `#4ECDC4`  Carbs: `#667eea`  Fat: `#f093fb`
- Fibre: `#43e97b`    Iron: `#fa709a`

### Meal colours (in app.js — MG object)
- Breakfast: `#FF9A3C` → `#FF6B6B`
- Lunch: `#4ECDC4` → `#44A08D`
- Dinner: `#667eea` → `#764ba2`
- Snacks: `#f093fb` → `#f5576c`

### Typography
- Font: DM Sans (Google Fonts)
- Logo: gradient text `#4ECDC4` → `#667eea`

### Adding more foods
Edit foods.js — each item follows this format:
```js
{n:"Product Name", b:"Brand", c:"Category", e:"🍽", cal:100, pro:5, carb:15, fat:2, fib:1, ir:0.5}
```
Categories: Cereals, Bread, Dairy, Meat, Fish, Vegetables, Fruits,
Pasta & Grains, Snacks, Sweets, Biscuits, Sauces, Ready Meals,
Fast Food, Drinks, Health, Frozen, Desserts, Baking

### Daily nutrition goals (in app.js — GL object)
```js
const GL = {cal:2000, pro:150, carb:250, fat:65, fib:30, ir:14};
```

## Barcode scanning notes

Barcodes are looked up in this order:
1. Local BC map (12 pre-loaded UK products, instant)
2. Direct Open Food Facts API (works when app is native/local file)
3. allorigins.win CORS proxy (fallback for browser contexts)

For reliable barcode lookup in production, wrap with Capacitor —
native apps bypass browser CORS restrictions entirely.

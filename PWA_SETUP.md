# Progressive Web App (PWA) Setup

This document explains the PWA setup and how to complete the icon generation process.

## What's Included

✅ **Service Worker** (`public/sw.js`)
- Offline support with intelligent caching strategies
- Network-first for API calls, cache-first for assets
- Automatic cache updates

✅ **Web App Manifest** (`public/manifest.json`)
- App metadata and branding
- Installation configuration
- Shortcut actions (quick create new list)
- Screenshots for app stores

✅ **PWA Meta Tags** (in `layout.tsx`)
- Mobile viewport optimization
- Theme color support (light and dark modes)
- Apple mobile web app support
- Proper favicon linking

✅ **Service Worker Registration** (`PwaRegister` component)
- Automatic registration on app load
- Periodic update checks (every minute)

✅ **Icon SVGs** (`public/icons/icon.svg`)
- Scalable vector graphics as base for icons
- Need to be converted to PNG for full PWA support

✅ **Offline Fallback Page** (`public/offline.html`)
- User-friendly offline experience
- Clear messaging about connection status

## Getting Started

### Option 1: Quick Setup (Development)

For testing the PWA locally without icons:

```bash
npm run dev
```

The app will work as a PWA even without PNG icons - they'll just appear as blanks in the install prompt.

### Option 2: Generate PNG Icons (Recommended)

#### Prerequisites

Install `sharp` for image processing:

```bash
npm install --save-dev sharp
```

#### Generate Icons

Run the icon generation script:

```bash
npm run generate-icons:sharp
```

This will create:
- `icon-192x192.png` (standard icon)
- `icon-192x192-maskable.png` (adaptive icon for Android)
- `icon-512x512.png` (large icon)
- `icon-512x512-maskable.png` (adaptive variant)
- `shortcut-new-list.png` (app shortcut icon)

### Option 3: Convert SVG to PNG Manually

If you prefer not to install `sharp`:

#### Using Online Tools

1. Go to [Convertio SVG to PNG](https://convertio.co/svg-png/)
2. Upload `public/icons/icon.svg`
3. Download the PNG file
4. Rename to `icon-192x192.png` and save to `public/icons/`
5. Repeat for different sizes (adjust conversion settings for 512x512)

#### Using ImageMagick (macOS/Linux)

```bash
# Install ImageMagick
brew install imagemagick

# Generate 192x192 icon
convert -density 192 public/icons/icon.svg -resize 192x192 public/icons/icon-192x192.png

# Generate 512x512 icon
convert -density 512 public/icons/icon.svg -resize 512x512 public/icons/icon-512x512.png

# Generate maskable variants (transparent background)
convert -density 192 public/icons/icon.svg -resize 192x192 public/icons/icon-192x192-maskable.png
convert -density 512 public/icons/icon.svg -resize 512x512 public/icons/icon-512x512-maskable.png
```

#### Using GraphicsMagick (alternative)

```bash
brew install graphicsmagick
gm convert -density 192 public/icons/icon.svg -resize 192x192 public/icons/icon-192x192.png
```

## Testing the PWA

### Desktop Chrome/Edge

1. Build the app: `npm run build && npm start`
2. Open Chrome DevTools (F12)
3. Go to **Application** → **Manifest**
4. Click "Add to shelf" or "Install app"

### Mobile (iOS)

1. Open Safari
2. Navigate to your PWA URL
3. Tap the **Share** button
4. Select **Add to Home Screen**

### Mobile (Android)

1. Open Chrome
2. Navigate to your PWA URL
3. Tap the three-dot menu
4. Select **Install app** or **Add to Home Screen**

## Caching Strategy

The service worker implements intelligent caching:

### Network-First (API Calls)
- Try network first
- Fall back to cached data if offline
- Updates cache automatically

### Cache-First (Static Assets)
- Serve from cache if available
- Update cache from network in background
- Fall back to offline page if needed

### Navigation (Pages)
- Try network first
- Fall back to cached page
- Show offline page if neither available

## Customization

### Update App Name/Description

Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name",
  "description": "Your app description"
}
```

### Change Theme Colors

Edit `public/manifest.json` and `layout.tsx`:
```json
{
  "theme_color": "#yourcolor",
  "background_color": "#yourcolor"
}
```

### Add Custom Icons

Replace `public/icons/icon.svg` with your own SVG, then regenerate PNGs.

### Modify Caching Rules

Edit `public/sw.js`:
- `STATIC_ASSETS`: patterns for assets to cache
- `API_ROUTES`: patterns for API endpoints
- `CACHE_NAME`: increment version (e.g., `groceries-v2`) to force cache refresh

## Deployment

### Production Checklist

- [ ] Generate PNG icons (all sizes)
- [ ] Test offline functionality
- [ ] Test app installation on mobile
- [ ] Enable HTTPS (required for PWA)
- [ ] Update app screenshots in manifest
- [ ] Customize colors to match branding
- [ ] Add app to web stores (Google Play, Apple App Store)

### HTTPS Requirement

PWAs **require HTTPS** in production. If deploying to Vercel, Netlify, or similar, HTTPS is automatic.

### Cache Invalidation

To force users to update the app:
1. Update `CACHE_NAME` in `public/sw.js` (e.g., `groceries-v2`)
2. Deploy the updated service worker
3. The old cache will be automatically deleted on next visit

## Troubleshooting

### "Install app" button not showing

- Check if icons exist in `public/icons/` (need at least 192x192)
- Verify manifest is valid: DevTools → Application → Manifest
- Ensure app is served over HTTPS
- Check theme color contrast

### Service worker not updating

- Clear DevTools → Application → Cache Storage
- Increment `CACHE_NAME` in `sw.js`
- Check DevTools → Application → Service Workers for active registrations

### Offline page not showing

- Verify `public/offline.html` exists
- Check service worker error logs in DevTools Console
- Test network failure: DevTools → Network → Offline checkbox

## Resources

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest Specification](https://www.w3.org/TR/appmanifest/)

## Next Steps

1. Generate PNG icons (see "Option 2" above)
2. Test installation on mobile devices
3. Deploy to production with HTTPS
4. Monitor PWA usage analytics
5. Update app metadata as needed

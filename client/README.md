# LORE React + TypeScript refactor — isolated review copy

This is a **first-stage migration**, not a finished replacement for the live LORE website. It was built from the unpacked `LORE_Browser_Source/public` export of published version 261 (source commit `2563c7ba2ccafbfe8c311fc889570ee3d0f9d1dc`). Original files and live deployments were not modified.

## What is implemented

- Expo SDK 57, React 19, strict TypeScript, shared React Native components for web / Android / iOS.
- Dedicated Home, Submission, Catalogue, Draft Review, Queue, and sample Verification screens.
- Explicit `NavigationContext`, `SubmissionDraftContext`, `QueueStatusContext`.
- Isolated device-local drafts, validation, quantity limits, service preference, front/back photo selection, deletion confirmation and storage-error handling.
- Original compressed catalogue reader ported to typed services using cross-platform gzip decoding; language → franchise → set → card search.
- DST-aware Sunday schedule and November 15 launch threshold; no fabricated queue availability.
- Native video controls using expo-video, original branded artwork, contain scaling for card/label assets.
- Static content extraction for all 181 HTML routes and inventory of all 161 original scripts.

## What is NOT yet ported

Static-content conversion is not behavior parity. Original admin/staff tools, signed-in cloud drafts, order quoting/payment, founder activation and access control, real chat/trading, receiving/shipping, specialist camera scanning, interactive games, and bespoke cinematic/3D animations still require dedicated ports and backend integration. Content-only pages display migration notices; original scripts are deliberately not executed or hidden inside WebViews. The layout is a shared responsive component design, not a pixel-identical conversion of 106 stylesheets. See `docs/ARCHITECTURE.md` and inventories.

This is not ready to replace the current site, accept payment, or publish to app stores. No real client records or production secrets are included.

## Run on web

1. Extract this ZIP into a new folder. Do not extract over the original site.
2. Install Node.js compatible with Expo SDK 57 (Node 24 was used for these checks).
3. Run `npm ci`.
4. Reuse your existing unpacked artwork/catalogue without changing it:
   `node scripts/import-assets.mjs /absolute/path/to/LORE_Browser_Source/public`
5. Run `npm run web`.

The small ZIP includes the primary brand and packaging assets. Other original artwork, films, downloads and the full catalogue are imported with step 4, keeping the code download small. No original HTML/CSS/JS is copied into the new public runtime. Avoid pointing the import command at this refactor's own public directory.

## Android and iOS

The UI already uses React Native primitives; another HTML-to-native conversion is not required for these components.

1. Complete the asset import above.
2. Copy `.env.example` to `.env`.
3. Set `EXPO_PUBLIC_ASSET_ORIGIN=http://YOUR_COMPUTER_LAN_IP:8081` using the address/port of your asset-serving Expo web server. The phone and computer must be on a network where that address is reachable. Android emulator can use `http://10.0.2.2:8081`. Do not use `localhost` on a physical phone to refer to your computer.
4. Keep `npm run web` serving the assets. In another terminal, start `npx expo start --port 8082` and open it using a compatible Expo Go/development build.
5. For local emulator launch use `npm run android`; an iOS simulator requires macOS. Native binary signing and device installation have not been performed here.

The asset server is separate from API integration. You may later deploy the original approved assets to a dedicated CDN and set the asset origin accordingly.

## Validate

- `npm run typecheck`
- `npm test`
- `npm run export:web`
- `npx expo export --platform ios --platform android --output-dir native-export`

Native bundle export checks JavaScript/Hermes compilation; it is not a device UI test or a signed IPA/APK. No production backend is enabled by default. `src/services/apiClient.ts` is a configurable future integration seam; it does not implement native login by itself.

## Source review

- `docs/ARCHITECTURE.md`: component/state/platform boundaries and limitations.
- `docs/route-inventory.json`: every original HTML route, script dependencies and content-migration status.
- `docs/script-inventory.json`: every original JavaScript file and discovered API paths.
- `docs/source-sha256.json`: checksum baseline for original export files.
- `scripts/import-content.py`: reproducible content extraction; Python standard library only.

All new files live in this separate folder. No Sites manifest, production project ID, deployment script, original localStorage key, or live API origin is included.

# Architecture and state ownership

The refactor is a new Expo React + TypeScript project, not a replacement of the published site. Expo uses React Native primitives on iOS/Android and React Native Web in browsers. No production Site identity or publishing credentials are included.

## Global contexts
- `NavigationContext`: current route and navigation action. Browser history is isolated in `navigation.web.ts`; native deep-link events are isolated in `navigation.ts`.
- `SubmissionDraftContext`: selected local draft, draft list, hydration state, storage failures, and explicit domain actions. Its storage key is `lore.refactor.review.drafts.v1`, never an original Locker key. Storage writes are serialized so stale writes cannot overwrite newer changes.
- `QueueStatusContext`: clock-derived schedule only. It never claims actual capacity or allocates places. America/New_York conversion accounts for daylight saving changes.

Transient input state is owned by the component that uses it: catalogue filters and pending requests in CatalogScreen; certification input in VerificationScreen; disclosure state in ContentRenderer. There is no window-global application state.

## Layers
- `domain/`: plain TypeScript data contracts, pure draft reducer, route normalization, schedule calculation. No React or browser imports.
- `services/`: catalogue decompression via fflate (no browser-only DecompressionStream), asset URLs, optional API transport. No live API instance is created in the app.
- `platform/`: device storage, photo selection, browser history/native deep-link boundaries.
- `components/`: reusable native controls, media, semantic content rendering, and brand styling.
- `screens/`: explicit collector journeys plus the complete static-content directory.
- `data/pages.json`: extracted HTML content represented as typed nodes. This is not executable HTML or a WebView.

## Original API boundaries
The original process-one/process-three, founder activation, staff operations, chat, payment, shipping and receiving endpoints require authenticated backend contracts and authorization. This build does not forward preview interactions to them. `LoreApiClient` is an explicit integration seam, not a claim that native authentication is implemented. Native bearer-token auth must be implemented against an agreed backend; browser session cookies must not be copied into mobile code.

## Media and assets
Existing approved images are reused without re-rendering labels. `Image` uses contain. `expo-video` provides platform-native video controls. User-selected photo data is local to this review app; browser quota failures are displayed. For production, upload photos through authenticated storage and persist references rather than base64.

## Important scope distinction
181 routes have static content extracted. That is not equivalent to 181 fully behavior-compatible screens. All 161 scripts are inventoried, but are not wrapped, executed, or falsely described as converted. Interactive accounts/admin/campaign games and several bespoke animation systems remain migration work. Source pages requiring those behaviors show a clear notice instead of pretending a disabled operation succeeded. This is an isolated first migration stage, not a complete functional replacement or pixel-identical recreation.

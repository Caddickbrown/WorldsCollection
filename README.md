# Worlds Collection

A personal iOS app that bundles all of Dan's web-based game and simulation projects into a single offline collection — no server, no CDN, runs entirely from the app bundle.

## Projects included

**Games**
- **Island Voxel** — third-person voxel explorer (Three.js r162)
- **Island** — 2D top-down adventure (Three.js r158)
- **World** — zero-player civilisation simulator (Three.js r169)
- **House** — first-person interior explorer (Three.js r158)
- **Pavilion** — single-storey modernist residence explorer (Three.js r158)

**Tech Demos**
- **Island Toon** — cel shading + custom outline post-process (Three.js r180)
- **World Voxel** — World sim rendered in 3D voxels (Three.js r153, pre-vendored)

## Architecture

- **SwiftUI** launcher — landscape-only, dark, DM Sans, minimal card grid
- **`WKURLSchemeHandler`** (`worlds://`) — serves game files directly from the app bundle with correct MIME types and COOP/COEP headers for SharedArrayBuffer / Worker support
- **`ControllerBridge`** — maps `GCController` (PS/Xbox/MFi) button/stick events to keyboard + Gamepad API events. Games that already poll `navigator.getGamepads()` (Island Voxel) work natively; others get keyboard-event simulation
- Each game's Three.js and addons are vendored locally — no CDN imports anywhere

## Adding a new game

1. Copy game files into `WorldsCollection/Resources/Games/<slug>/`
2. Replace any CDN import URLs with `worlds://<slug>/vendor/three/...`
3. Download the needed Three.js version into `vendor/three/`
4. Add a `GameDefinition` entry to `Engine/GameDefinition.swift`

## Build

Open `WorldsCollection.xcodeproj` in Xcode 15+, select your device, build & run.

iOS 16.0+, landscape only. No third-party dependencies.

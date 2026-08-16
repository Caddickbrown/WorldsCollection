# Island Engine

A browser-based 3D explorable island town built with Three.js — a proof-of-concept prototype before the planned Godot 4 port.

## What It Is

A third-person 3D world where you walk around a solarpunk island community (~600×600 units) with rolling terrain, distinct named areas, and five NPCs going about their daily lives on simulated schedules.

## Features

- **Explorable island** with procedural terrain (sine/cosine heightmap), fog, and a warm golden-hour sky
- **10 named areas**: Town Square, Bakery, Post Office, Library, Workshop, Farm, Forest Path, The Hilltop, The Dock, South Beach — title updates as you walk between them
- **5 NPCs** with full 24-hour daily schedules: Mabel (Baker), Gus (Postman), Fern (Farmer), Olive (Shopkeeper), Rosa (Library Keeper)
- NPCs walk to their scheduled locations in real time and show activity labels when you get close
- Camera-relative WASD movement + drag-to-look mouse control
- NPCs and player all follow terrain height correctly

## Controls

| Key | Action |
|-----|--------|
| `W A S D` / Arrow keys | Move |
| Click + drag | Look around |
| Mouse scroll (future) | Zoom |

## Running It

Requires a local server (ES modules need HTTP). From the `island/` directory:

```bash
python3 -m http.server 8780
```

Then open `http://localhost:8780`.

## Architecture

| File | Purpose |
|------|---------|
| `index.html` | Entry point, renderer setup, game loop, HUD |
| `scene.js` | Island geometry, terrain heightmap, area definitions, building placement |
| `player.js` | `PlayerController` — movement, camera orbit, terrain following |
| `npcs.js` | `NPCManager` + `NPC` — schedules, locomotion, terrain snapping, labels |

**Terrain** is a 100×100 subdivided `PlaneGeometry` with per-vertex heights set by `getHeight(x, z)` — a combination of sine/cosine waves. The same function is used by both the player and NPCs to stay grounded.

**Simulated time**: 1 real second = 10 sim minutes, so a full day passes in ~2.4 real minutes. NPCs check their schedule each frame and walk to the appropriate area.

## Long-Term Plan

Port to Godot 4 for proper collision, richer NPC AI, dialogue, and interior scenes. This Three.js version is a rapid prototype to get a feel for the world layout and character design.

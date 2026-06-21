// World Voxel — Terrain bridge
// Converts World's 128x128 tile grid into a voxel heightmap.
// Each tile maps to a TILE_VOXELS x TILE_VOXELS footprint.
// Heights and voxel types are derived from tile.type and tile.elevation.

export const TILE_VOXELS = 4;       // world-grid tile → this many voxels wide/deep
export const SEA_LEVEL   = 12;      // voxel Y of sea surface
export const MAX_HEIGHT  = 32;      // maximum terrain height in voxels

// World tile types → voxel palette
const TILE_TO_VOXEL = {
  DEEP_WATER:  'DEEP_WATER',
  WATER:       'WATER',
  BEACH:       'SAND',
  GRASS:       'GRASS',
  WOODLAND:    'GRASS',
  FOREST:      'MOSS',
  DESERT:      'SAND',
  STONE:       'STONE',
  MOUNTAIN:    'STONE',
  GLACIER:     'SNOW',
  LAVA:        'STONE',   // renderer will tint differently
  DIRT:        'DIRT',
};

// Approximate height from World elevation float (0..1 typical range)
function elevToVoxelHeight(elevation, tileType) {
  if (tileType === 'DEEP_WATER') return SEA_LEVEL - 4;
  if (tileType === 'WATER')      return SEA_LEVEL - 1;
  if (tileType === 'BEACH')      return SEA_LEVEL;
  if (tileType === 'GLACIER' || tileType === 'MOUNTAIN') {
    return SEA_LEVEL + 8 + Math.round((elevation || 0.8) * 10);
  }
  if (tileType === 'STONE')      return SEA_LEVEL + 4 + Math.round((elevation || 0.5) * 6);
  return SEA_LEVEL + 1 + Math.round((elevation || 0) * 6);
}

// Build a flat voxel heightmap array from World tile data.
// tiles: flat array of tile objects (length worldW * worldH), row-major [z][x]
// Returns { heights: Uint8Array(worldW*TILE_VOXELS * worldH*TILE_VOXELS),
//           types:   Uint8Array(same size),
//           voxelW, voxelH }
export function buildHeightmap(tiles, worldW, worldH) {
  const voxelW = worldW * TILE_VOXELS;
  const voxelH = worldH * TILE_VOXELS;
  const heights = new Uint8Array(voxelW * voxelH);
  const types   = new Uint8Array(voxelW * voxelH);

  for (let tz = 0; tz < worldH; tz++) {
    for (let tx = 0; tx < worldW; tx++) {
      const tile = tiles[tz * worldW + tx];
      if (!tile) continue;
      const h    = elevToVoxelHeight(tile.elevation, tile.type);
      const vt   = voxelTypeIndex(TILE_TO_VOXEL[tile.type] || 'GRASS');

      for (let dz = 0; dz < TILE_VOXELS; dz++) {
        for (let dx = 0; dx < TILE_VOXELS; dx++) {
          const vx = tx * TILE_VOXELS + dx;
          const vz = tz * TILE_VOXELS + dz;
          const i  = vz * voxelW + vx;
          heights[i] = h;
          types[i]   = vt;
        }
      }
    }
  }
  return { heights, types, voxelW, voxelH };
}

// Returns the voxel surface Y at tile-grid coords (tx, tz)
export function tileToSurfaceY(tiles, worldW, tx, tz) {
  const tile = tiles[tz * worldW + tx];
  if (!tile) return SEA_LEVEL;
  return elevToVoxelHeight(tile.elevation, tile.type);
}

// Convert tile-grid coords to voxel-grid coords (centre of tile footprint)
export function tileToVoxel(tx, tz) {
  return {
    vx: tx * TILE_VOXELS + Math.floor(TILE_VOXELS / 2),
    vz: tz * TILE_VOXELS + Math.floor(TILE_VOXELS / 2),
  };
}

// Voxel type name → integer index (must match mesher VCOLOR palette)
const VT_MAP = {
  AIR:0, GRASS:1, DIRT:2, STONE:3, SAND:4, WATER:5, DEEP_WATER:6,
  SNOW:7, ROCK:8, MOSS:9, PEBBLE:10, GRASS_DARK:11, GRASS_HIGH:12,
  SAND_WET:13, WOOD:14, LEAF:15, LEAF_DARK:16, LEAF_AUTUMN:17,
  PINE:18, PALM:19,
};
function voxelTypeIndex(name) { return VT_MAP[name] ?? VT_MAP.GRASS; }

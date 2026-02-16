import type { AssetCache } from './types'

// ── Asset path definitions ──
function buildAssetPaths(): Record<string, string> {
  const paths: Record<string, string> = {}

  // Tiles (4 levels each)
  for (const terrain of ['grass', 'forest', 'water', 'special']) {
    for (let lvl = 1; lvl <= 4; lvl++) {
      paths[`tile_${terrain}_${lvl}`] = `/assets/tiles/${terrain}/${terrain}_lvl_${lvl}.png`
    }
  }

  // Beast clan units (1-18)
  for (let i = 1; i <= 18; i++) {
    const idx = i.toString().padStart(2, '0')
    paths[`beast_unit_${i}`] = `/assets/beastClan/units/beast_${idx}.png`
  }

  // Demon clan units (1-18)
  for (let i = 1; i <= 18; i++) {
    const idx = i.toString().padStart(2, '0')
    paths[`demon_unit_${i}`] = `/assets/demonClan/units/demon_${idx}.png`
  }

  // Buildings (beast and demon variants)
  for (const type of ['townhall', 'barlack', 'magetower', 'watchtower', 'wall']) {
    paths[`building_${type}_beast`] = `/assets/buildings/${type}_bf.jpg`
    paths[`building_${type}_demon`] = `/assets/buildings/${type}_dm.jpg`
  }

  // Faction logos
  paths['logo_beast'] = '/assets/beastClan/beastClan.png'
  paths['logo_demon'] = '/assets/demonClan/demonClan.png'

  // UI icons
  paths['ui_build'] = '/assets/ui/build.jpg'
  paths['ui_endturn'] = '/assets/ui/endturn.jpg'
  paths['ui_units_dictionary'] = '/assets/ui/units_dictionary.jpg'

  return paths
}

export const ASSET_PATHS = buildAssetPaths()

// ── Get building asset key (map 'barracks' to 'barlack' in file names) ──
export function getBuildingAssetKey(type: string, faction: string): string {
  const fileType = type === 'barracks' ? 'barlack' : type
  return `building_${fileType}_${faction}`
}

// ── Preload all assets ──
export function preloadAssets(): Promise<AssetCache> {
  const cache: AssetCache = new Map()
  const entries = Object.entries(ASSET_PATHS)

  const promises = entries.map(([key, path]) => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        cache.set(key, img)
        resolve()
      }
      img.onerror = () => {
        // Still resolve -- missing asset shouldn't block the game
        console.warn(`Failed to load asset: ${key} (${path})`)
        resolve()
      }
      img.src = path
    })
  })

  return Promise.all(promises).then(() => cache)
}

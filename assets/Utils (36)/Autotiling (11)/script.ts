module Autotiling {
  export let adjacentAutotiles = [ { "x":  0, "y": -1, "value": 4 }, { "x":  1, "y":  0, "value": 2 }, { "x":  0, "y":  1, "value": 1 }, { "x": -1, "y":  0, "value": 8 } ];
  export let tileSetWidth = 16;
  
  export function isIceAt(x: number, y: number): boolean {
    if (Autotiling.isWaterAt(x, y)) { return false }
      
    let tile = Game.map.getTileAt(Game.iceLayer, x, y);
    return tile >= 1 && tile <= 7
  }
  
  export function isBrokenIceAt(x: number, y: number) : boolean {
    if (Autotiling.isWaterAt(x, y)) { return true }
      
    let tile = Game.map.getTileAt(Game.iceLayer, x, y);
    return tile > 1 && tile <= 7
  }
    
  export function isWaterAt(x: number, y: number): boolean {
    let tile = Game.map.getTileAt(Game.waterLayer, x, y);
    return tile != -1
  }
    
  export function canFallAt(x: number, y: number) : boolean {
    if (Autotiling.isWaterAt(x, y) && Game.map.getTileAt(Game.collisionLayer, x, y) != 14) { return true }
    return false
  }

  export function computeWater(x: number, y: number) {
    let autotileValue = 0;

    let i = 0;
    while (i < 4) {
      let adjacentAutotile = Autotiling.adjacentAutotiles[i];

      if (Autotiling.isWaterAt(x + adjacentAutotile.x, y + adjacentAutotile.y)) {
        autotileValue += adjacentAutotile.value;
      }

      i += 1;
    }

    let tileSetX = autotileValue % 4;
    let tileSetY = 1 + Math.floor(autotileValue / 4);
    return tileSetY * Autotiling.tileSetWidth + tileSetX;
  }
  
  export function refreshWater(x: number, y: number) {
    if (! Autotiling.isWaterAt(x, y)) { return }
    Game.map.setTileAt(Game.waterLayer, x, y, Autotiling.computeWater(x, y));
  }

  export function refreshWaterAround(x: number, y: number) {
    Autotiling.refreshWater(x - 1, y);
    Autotiling.refreshWater(x + 1, y);
    Autotiling.refreshWater(x, y - 1);
    Autotiling.refreshWater(x, y + 1);
  }
}
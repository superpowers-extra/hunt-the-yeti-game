class WaterManager extends Sup.Behavior {
  waterTilesByXY: { [key: string]: { "x": number; "y": number; "regeneration": number; }; } = {};
  waterTiles: { "x": number; "y": number; "regeneration": number; }[] = [];

  digSteps = 6;
  iceRegenerationDuration = 300;
  waterRegenerationDuration = 1500;
    
  awake() {
    for (let y = 0; y < Game.map.getHeight(); y++) {
      for (let x = 0; x < Game.map.getWidth(); x++) {
        if (Autotiling.isBrokenIceAt(x, y)) {
          Game.map.setTileAt(Game.iceLayer, x, y, 1)
          Game.map.setTileAt(Game.waterLayer, x, y, -1)
        }
      }
    }
  }
      
  update() {
    let index = 0;
    while (index < this.waterTiles.length) {
      let waterTile = this.waterTiles[index];
      waterTile.regeneration -= 1;
      if (waterTile.regeneration == 0) {
        if (Autotiling.isWaterAt(waterTile.x, waterTile.y)) {
          Game.map.setTileAt(Game.waterLayer, waterTile.x, waterTile.y, -1);
          Autotiling.refreshWaterAround(waterTile.x, waterTile.y);
          Game.map.setTileAt(Game.iceLayer, waterTile.x, waterTile.y, this.digSteps);
        }
        else {
          let tile = Game.map.getTileAt(Game.iceLayer, waterTile.x, waterTile.y) - 1;
          Game.map.setTileAt(Game.iceLayer, waterTile.x, waterTile.y, tile);
          
          if (tile == 1) {
            let waterTile = this.waterTiles[index];
            delete this.waterTilesByXY[ waterTile.x + "_" + waterTile.y ];
            this.waterTiles.splice(index, 1);
            continue
          }
        }
        
        waterTile.regeneration = this.iceRegenerationDuration;
      }
      index += 1
    }
  }
  
  addTile(x: number, y: number) {
    if (Autotiling.isBrokenIceAt(x, y)) {
      let tileInfo = { "x": x, "y": y, "regeneration": this.iceRegenerationDuration };
      if (Autotiling.isWaterAt(x, y)) {
        tileInfo.regeneration = this.waterRegenerationDuration;
      }

      this.waterTiles.push(tileInfo)
      this.waterTilesByXY[ x + "_" + y ] = tileInfo;
    }
  }
      
  removeTile(x: number, y: number) {
    let tileInfo = this.waterTilesByXY[ x + "_" + y ];
    if (tileInfo) {
      delete this.waterTilesByXY[ x + "_" + y ];
      this.waterTiles.splice(this.waterTiles.indexOf(tileInfo), 1);
    }
  }
}
Sup.registerBehavior(WaterManager);
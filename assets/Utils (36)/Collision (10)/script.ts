module Collision {
  export function isBlockedAt(x: number, y: number, avoidWater: boolean) {
    return Game.map.getTileAt(Game.collisionLayer, x, y) == 0 || Game.map.getTileAt(Game.collisionLayer, x, y) == 13 || (avoidWater && Autotiling.isWaterAt(x, y) && Game.map.getTileAt(Game.collisionLayer, x, y) != 14)
  }
    
  export function move(position: Sup.Math.Vector3, width: number, height: number, offset: Sup.Math.Vector3, avoidWater: boolean) {
    let mapLeft = Math.floor(position.x - width / 2);
    let mapRight = Math.floor(position.x + width / 2);
    let mapTop = Math.floor(position.y + height / 2);
    let mapBottom = Math.floor(position.y - height / 2);
    
    let diff: number;
    let blocked: boolean;
    
    // Horizontal offset
    let mapHorizontalLimit: number;
    let mapY: number;

    if (offset.x < 0) {
      mapHorizontalLimit = mapLeft - 1;
      diff = (position.x - width / 2 + offset.x) - mapLeft;

      if (diff <= 0) {
        blocked = false;
        mapY = mapBottom;
        while (mapY <= mapTop) {
          if (Collision.isBlockedAt(mapHorizontalLimit, mapY, avoidWater)) {
            blocked = true;
            break
          }
          mapY += 1;
        }
        
        if (blocked) { offset.x = Math.min(0, offset.x - diff); }
      }
    }
    else if (offset.x > 0) {
      mapHorizontalLimit = mapRight + 1;
      diff = (position.x + width / 2 + offset.x) - mapRight;

      if (diff > 1) {
        blocked = false;
        mapY = mapBottom;
        while (mapY <= mapTop) {
          if (Collision.isBlockedAt(mapHorizontalLimit, mapY, avoidWater)) {
            blocked = true;
            break
          }
          mapY += 1;
        }

        if (blocked) { offset.x = Math.max(0, offset.x - diff); }
      }
    }
    
    // Vertical offset
    let mapVerticalLimit: number;
    let mapX: number;

    if (offset.y < 0) {
      mapVerticalLimit = mapBottom - 1;
      diff = (position.y - height / 2 + offset.y) - mapBottom;

      if (diff <= 0) {
        blocked = false;

        mapX = mapLeft;
        while (mapX <= mapRight) {
          if (Collision.isBlockedAt(mapX, mapVerticalLimit, avoidWater)) {
            blocked = true;
            break
          }
          mapX += 1;
        }

        if (blocked) { offset.y = Math.min(0, offset.y - diff); }
      }
    }
    
    else if (offset.y > 0) {
      mapVerticalLimit = mapTop + 1;
      diff = (position.y + height / 2 + offset.y) - mapTop;

      if (diff > 1) {
        blocked = false;

        mapX = mapLeft;
        while(mapX <= mapRight) {
          if (Collision.isBlockedAt(mapX, mapVerticalLimit, avoidWater)) {
            blocked = true;
            break
          }
          mapX += 1;
        }

        if (blocked) { offset.y = Math.max(0, offset.y - diff); }
      }
    }
  }
}
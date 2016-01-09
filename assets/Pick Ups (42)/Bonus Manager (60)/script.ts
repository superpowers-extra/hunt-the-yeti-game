class BonusManager extends Sup.Behavior {
  spawnTimer = 0;
  spawnDuration = 30 * 60;
  
  update() {
    this.spawnTimer += 1
    if (this.spawnTimer === this.spawnDuration) {
      this.spawn()
      this.spawnTimer = 0;
    }
  }
  
  spawn() {
    let pickUpActor = new Sup.Actor("Health");
    
    // Place it at a random location
    let position = new Sup.Math.Vector3(0, 0, -0.2);
    let playerPosition = Game.playerActor.getLocalPosition();
    
    while (Game.map.getTileAt(0, position.x, position.y) === 0 || Game.map.getTileAt(0, position.x, position.y) === 13 || position.distanceTo(playerPosition) < 8) {
      position.x = Sup.Math.Random.integer(1, Game.map.getWidth()) - 1;
      position.y = Sup.Math.Random.integer(1, Game.map.getHeight()) - 1;
    }
    
    position.x += 0.5;
    position.y += 0.5;
    pickUpActor.setLocalPosition(position);
    
    let pickUpBehavior = pickUpActor.addBehavior(PickUpBehavior, { sprite: "Health" });
  }
}
Sup.registerBehavior(BonusManager);

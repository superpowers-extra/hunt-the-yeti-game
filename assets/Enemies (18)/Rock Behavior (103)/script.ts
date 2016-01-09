class RockBehavior extends Sup.Behavior {
  position = this.actor.getLocalPosition();
  bodyPosition: Sup.Math.Vector3;
  fallSpeed = 0;
  maxFallSpeed = 0.3;
  gravity = 0.01;

  bodyActor: Sup.Actor;
  
  awake() {
    new Sup.SpriteRenderer(this.actor, "Effects/Shadow");
    
    this.bodyActor = new Sup.Actor("Body", this.actor);
    
    this.bodyPosition = this.bodyActor.getLocalPosition();
    this.bodyPosition.y += 15 + Sup.Math.Random.integer(0, 5);
    this.bodyPosition.z += 0.1;
    this.bodyActor.setLocalPosition(this.bodyPosition);
    new Sup.SpriteRenderer(this.bodyActor, "Enemies/Rock");
  }
  
  update() {
    if (this.bodyPosition.y > 0) {
      this.fallSpeed = Math.min(this.maxFallSpeed, this.fallSpeed + this.gravity);
      
      this.bodyPosition.y -= this.fallSpeed;
      this.bodyActor.setLocalPosition(this.bodyPosition);
      
      if (this.bodyPosition.y <= 0) {
        this.bodyActor.spriteRenderer.setAnimation("Animation", false);
        
        // Check distance with the player
        let playerPosition = Game.playerActor.getLocalPosition();
        let diffToPlayer = playerPosition.clone().subtract(this.position);
        if (diffToPlayer.length() < 1) Game.playerActor.getBehavior(PlayerBehavior).hit(diffToPlayer.normalize());

        // Break ice
        let x = Math.floor(this.position.x);
        let y = Math.floor(this.position.y);
        
        if (Autotiling.isWaterAt(x, y)) Sup.Audio.playSound("Effects/Water Splash");
          
        else if (Autotiling.isIceAt(x, y)) {
          if (!Autotiling.isBrokenIceAt(x, y)) Game.waterManager.addTile(x, y);
            
          Game.map.setTileAt(Game.waterLayer, x, y, 16);
          Autotiling.refreshWater(x, y);
          Autotiling.refreshWaterAround(x, y);

          Sup.Audio.playSound("Player/Breaking Ice", 0.5);
        }
        else Sup.Audio.playSound("Enemies/Rock Sound");
      }
    }
    else if (!this.bodyActor.spriteRenderer.isAnimationPlaying()) this.actor.destroy();
  }
}
Sup.registerBehavior(RockBehavior);

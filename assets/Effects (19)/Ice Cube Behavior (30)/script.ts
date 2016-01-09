class IceCubeBehavior extends Sup.Behavior {
  timer = 0;
  floatDuration = 120;
  x: number;
  y: number;
  
  awake() {
    new Sup.SpriteRenderer(this.actor, "Effects/Ice Cube");
    this.actor.spriteRenderer.setAnimation("Idle");
    
    let position = this.actor.getLocalPosition();
    this.x = Math.floor(position.x);
    this.y = Math.floor(position.y);
    
    Game.map.setTileAt(0, this.x, this.y, 14);
  }
  
  update() {
    if (this.timer === this.floatDuration) {
      if (!this.actor.spriteRenderer.isAnimationPlaying()) {
        Game.map.setTileAt(0, this.x, this.y, -1);
        this.actor.destroy();
      }
      return;
    }
    this.timer += 1;
    if (this.timer === this.floatDuration) this.actor.spriteRenderer.setAnimation("Drown", false);
  }
}
Sup.registerBehavior(IceCubeBehavior);

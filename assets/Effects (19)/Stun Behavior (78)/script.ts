class StunBehavior extends Sup.Behavior {
  timer = 0;
  duration: number;
  
  awake() {
    new Sup.SpriteRenderer(this.actor, "Effects/Stun").setAnimation("Animation");
  }
  
  update() {
    this.timer += 1
    if (this.timer === this.duration) this.actor.destroy();
  }
}
Sup.registerBehavior(StunBehavior);
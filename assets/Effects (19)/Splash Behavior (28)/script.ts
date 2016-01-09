class SplashBehavior extends Sup.Behavior {
  awake() {
    new Sup.SpriteRenderer(this.actor, "Effects/Splash");
    this.actor.spriteRenderer.setAnimation("Splash", false);
  }
  
  update() {
    if (!this.actor.spriteRenderer.isAnimationPlaying()) this.actor.destroy();
  }
}
Sup.registerBehavior(SplashBehavior);

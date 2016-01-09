class WinBehavior extends Sup.Behavior {
  scale = new Sup.Math.Vector3(0.01);
  targetScale = new Sup.Math.Vector3(1);
  
  awake() {
    new Sup.SpriteRenderer(this.actor, "Menus/Win Screen");
    this.actor.setLocalScale(this.scale);
  }
  
  update() {
    this.scale.lerp(this.targetScale, 0.1);
    this.actor.setLocalScale(this.scale);
  
    if (Sup.Input.wasKeyJustReleased("SPACE") || Sup.Input.wasGamepadButtonJustPressed(0, 0)) Game.finish();
  }
}
Sup.registerBehavior(WinBehavior);

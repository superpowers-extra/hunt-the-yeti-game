class TitleScreenBehavior extends Sup.Behavior {
  state = "open";
  openPosition: Sup.Math.Vector3;
  closedPosition: Sup.Math.Vector3;
  position: Sup.Math.Vector3;

  awake() {
    this.openPosition = this.actor.getLocalPosition();
    this.closedPosition = this.openPosition.clone();
    this.closedPosition.y += 15;
    this.position = this.closedPosition.clone();
  }
  
  update() {
    let targetPosition = this.openPosition;
  
    if (this.state === "open") {
      if (Sup.Input.wasGamepadButtonJustPressed(0, 0)) {
        this.state = "closed";
        Game.setUsingGamepad(true);
      }
      if (Sup.Input.wasKeyJustPressed("SPACE")) {
        this.state = "closed";
        Game.setUsingGamepad(false);
      }
    }
    else if (this.state === "closed") {
      targetPosition = this.closedPosition;
      
      if (this.position.distanceTo(targetPosition) < 0.5) {
        this.actor.destroy();
        return
      }
    }

    this.position.lerp(targetPosition, 0.05);
    this.actor.setLocalPosition(this.position);
  }
}
Sup.registerBehavior(TitleScreenBehavior);

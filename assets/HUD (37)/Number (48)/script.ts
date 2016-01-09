class NumberBehavior extends Sup.Behavior {
  value = 0;
  digitActors: Array<Sup.Actor> = [];
  displayPlus = false;
  font = "HUD/Digits";

  start() { this.setValue(this.value); }
    
  setValue(value: number) {
    this.value = value;
    let stringValue = "" + this.value;
    
    if (this.displayPlus) stringValue = "+" + stringValue;
      
    // Remove any extra digit
    while (this.digitActors.length > stringValue.length) {
      this.digitActors[this.digitActors.length - 1].destroy();
      this.digitActors.splice(this.digitActors.length - 1, 1);
    }
    
    // Add any missing digit
    while (this.digitActors.length < stringValue.length) {
      let digitActor = new Sup.Actor("Digit", this.actor);
      new Sup.SpriteRenderer(digitActor, Sup.get(this.font, Sup.Sprite));
      digitActor.spriteRenderer.setAnimation("Animation", false);
      digitActor.spriteRenderer.stopAnimation();
      this.digitActors.push(digitActor);
    }
    
    let digitSpacing = 0.65;
    for (let i = 0; i < stringValue.length; i++) {
      let digit = parseInt(stringValue[i]);
      
      if (stringValue[i] == "-") digit = 10;
      if (stringValue[i] == "+") digit = 11;
        
      let digitActor = this.digitActors[i];
      digitActor.setLocalPosition(new Sup.Math.Vector3(digitSpacing * (i - stringValue.length / 2), 0, 0));
      digitActor.spriteRenderer.setAnimationFrameTime(digit);
    }
  }
}
Sup.registerBehavior(NumberBehavior);
class FloatUpBehavior extends Sup.Behavior {
  timer = 0;
  duration = 30;
  delay = 0;
  speed = 0.1;

  update() {
    if (this.delay > 0) {
      this.delay -= 1;
      return;
    }
  
    let factor = 1 - this.timer / this.duration;
    this.actor.moveY(this.speed * factor);
    
    this.setOpacityRecursive(this.actor, factor);
    
    this.timer += 1;
    if (this.timer === this.duration) this.actor.destroy();
  }
  
  setOpacityRecursive(object: Sup.Actor, factor: number) {
    let children = object.getChildren();
    if (children.length > 0) {
      let i = 0;
      while (i < children.length) {
        this.setOpacityRecursive(children[i], factor);
        i += 1;
      }
    }
    else object.spriteRenderer.setOpacity(factor);
  }
}
Sup.registerBehavior(FloatUpBehavior);

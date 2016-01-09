class ShipBehavior extends Sup.Behavior {
  landed = false;
  fallSpeed = 0.15;

  flamTimer = 0;
  stopFlamTimer = 30;
  openDoorTimer = 10;
  playerTimer = 20;

  position: Sup.Math.Vector3;
  bodyActor: Sup.Actor;
  shadowActor: Sup.Actor;
  doorActor: Sup.Actor;
  leftFlamActor: Sup.Actor;
  rightFlamActor: Sup.Actor;
  
  awake() {
    this.bodyActor = Sup.getActor("Ship");
    this.position = this.bodyActor.getLocalPosition();
    this.shadowActor = Sup.getActor("Ship Shadow");
    this.doorActor = Sup.getActor("Door");
    this.leftFlamActor = Sup.getActor("Flam Left");
    this.rightFlamActor = Sup.getActor("Flam Right");
    
    if (this.landed) {
      this.stopFlamTimer = 0;
      this.openDoorTimer = 0;
      this.playerTimer = 0;

      this.leftFlamActor.destroy();
      this.rightFlamActor.destroy();
      
      let position = this.actor.getLocalPosition();
      position.z = -0.5;
      this.actor.setLocalPosition(position);

      this.position = this.bodyActor.getLocalPosition();
      this.position.y = 0;
      this.bodyActor.setLocalPosition(this.position);
      
      this.shadowActor.setLocalScale(1, 1, 1);
      
      this.doorActor.spriteRenderer.setAnimation("Close", false);
      Sup.Audio.playSound("Ship/Door Sound");
    }
    else {
      this.bodyActor.spriteRenderer.setAnimation("Animation");
      this.doorActor.setLocalScale(new Sup.Math.Vector3(0.001));
      Game.playerActor.setLocalScale(new Sup.Math.Vector3(0.001));
      
      Sup.Audio.playSound("Ship/Landing");
    }
  }
  
  update() {
    if (this.landed) return;
      
    if (this.position.y > 0) {
      this.fallSpeed = Math.max(0.02, this.fallSpeed * 0.98);

      this.position.y = Math.max(0, this.position.y - this.fallSpeed);
      this.bodyActor.setLocalPosition(this.position);
      
      this.flamTimer += 1;
      let scaleFactor = Math.sin(this.flamTimer / 8);
      let scale = new Sup.Math.Vector3(1 + 0.02 * scaleFactor, 1 + 0.1 *scaleFactor , 1);
      this.leftFlamActor.setLocalScale(scale);
      this.rightFlamActor.setLocalScale(scale);
      
      let shadowScale = new Sup.Math.Vector3(1 - this.position.y / 12, 1 - this.position.y / 12, 1);
      this.shadowActor.setLocalScale(shadowScale);
    }
    else if (this.stopFlamTimer > 0) {
      this.stopFlamTimer -= 1
      if (this.stopFlamTimer == 0) {
        this.bodyActor.spriteRenderer.stopAnimation();
        this.doorActor.setLocalScale(new Sup.Math.Vector3(1));
        this.leftFlamActor.destroy();
        this.rightFlamActor.destroy();
      }
    }
    else if (this.openDoorTimer > 0) {
      this.openDoorTimer -= 1;
      if (this.openDoorTimer == 0) {
        this.doorActor.spriteRenderer.setAnimation("Open", false);
        Sup.Audio.playSound("Ship/Door Sound");
      }
    }
    else if (this.playerTimer > 0 && ! this.doorActor.spriteRenderer.isAnimationPlaying()) {
      this.playerTimer -= 1;
      if (this.playerTimer === 0) {
        
        let position = this.actor.getLocalPosition();
        position.z = -0.5;
        this.actor.setLocalPosition(position);
        
        this.doorActor.spriteRenderer.setAnimation("Close", false);
        Sup.Audio.playSound("Ship/Door Sound");
      
        Game.start();
      }
    }
  }
}
Sup.registerBehavior(ShipBehavior);
class PickUpBehavior extends Sup.Behavior {
  sprite: string;
    
  timer = 0;
  despawnDuration = 15 * 60;
  scoreValue = 10;

  position: Sup.Math.Vector3;
  scale = new Sup.Math.Vector3(1);

  shadowActor: Sup.Actor;
  shadowScale = new Sup.Math.Vector3(1);

  objectActor: Sup.Actor;
  objectPosition = new Sup.Math.Vector3(0, 0, 0.1);

  speed = new Sup.Math.Vector3();
  
  awake() {
    Game.pickUps.push(this);
  
    this.position = this.actor.getLocalPosition();
    
    this.shadowActor = new Sup.Actor("Shadow", this.actor);
    new Sup.SpriteRenderer(this.shadowActor, "Effects/Shadow");
  }

  start() {
    this.objectActor = new Sup.Actor("Object", this.actor);
    new Sup.SpriteRenderer(this.objectActor, `Pick Ups/${this.sprite}`);
    this.objectActor.spriteRenderer.setAnimation("Animation");
  }
  
  update() {
    this.timer += 1
    
    if (this.timer > this.despawnDuration) {
      Game.pickUps.splice(Game.pickUps.indexOf(this), 1)
      this.actor.destroy();
      return;
    }
    
    else if (this.timer > 0.9 * this.despawnDuration) {
      if (this.timer % 10 < 5) {
        this.scale.x = 0;
        this.scale.y = 0;
      }
      else {
        this.scale.x = 1;
        this.scale.y = 1;
      }
      this.actor.setLocalScale(this.scale);
    }
    
    if (this.speed.length() > 0.01) {
      Collision.move(this.position, 0.5, 0.5, this.speed, false);
      this.position.add(this.speed);
      this.speed.multiplyScalar(0.96);
      this.actor.setPosition(this.position);
    
      let playerPosition = Game.playerActor.getLocalPosition();
      let playerDiff = this.position.clone().subtract(playerPosition);
      playerDiff.z = 0;
      if (playerDiff.length() < 1) {
        playerDiff.normalize().multiplyScalar(0.1);
        Collision.move(this.position, 0.5, 0.5, playerDiff, false);
        this.position.add(playerDiff);
        this.actor.setPosition(this.position);
      }
    }
    
    // Avoid stacking with other pick ups
    let i = 0;
    let diff = new Sup.Math.Vector3();
    while (i < Game.pickUps.length) {
      let pickUp = Game.pickUps[i];
      i += 1;
      
      if (pickUp == this) { continue }
        
      diff.copy(this.position).subtract(pickUp.position);
      if (diff.length() == 0) { diff.set(Sup.Math.Random.integer(-1, 1) / 20, Sup.Math.Random.integer(-1, 1) / 20, 0); }
        
      if (diff.length() < 0.5) {
        diff.normalize().multiplyScalar(0.01);
        Collision.move(this.position, 0.1, 0.1, diff, false);
        this.position.add(diff);
        this.actor.setLocalPosition(this.position);
      }
    }
    
    // Animation object and scale for prettiness
    this.objectPosition.y = 0.1 + 0.05 * Math.sin(this.timer / 10) + this.speed.length() * 3;
    this.objectActor.setLocalPosition(this.objectPosition);
    
    this.shadowScale.x = 0.5 + 0.05 * (1 - Math.sin(this.timer / 10));
    this.shadowScale.y = 0.5 + 0.05 * (1 - Math.sin(this.timer / 10));
    this.shadowActor.setLocalScale(this.shadowScale);
    
    // Pick it up
    diff = this.position.clone().subtract(Game.playerActor.getLocalPosition());
    diff.z = 0;
    if (diff.length() < 1 && this.speed.length() < 0.04) {
      this.pickup();
      Game.pickUps.splice(Game.pickUps.indexOf(this), 1);
      this.actor.destroy();
    }
  }
    
  pickup() {
    Sup.Audio.playSound(`Effects/Pick Up ${this.sprite}`, 0.3);
    
    let value: number;
    if (this.sprite === "Health") {
      Game.playerActor.getBehavior(PlayerBehavior).heal();
      value = 1;
    }
      
    else if (this.sprite === "Big Gem" || this.sprite === "Gem" || this.sprite === "Coin") {
      Game.scoreBehavior.setValue(Game.scoreBehavior.value + this.scoreValue);
      value = this.scoreValue;
    }
    
    let floatScoreActor = new Sup.Actor("Float Score", Sup.getActor("HUD"));
    floatScoreActor.setLocalScale(new Sup.Math.Vector3(0.5));
    floatScoreActor.setPosition(new Sup.Math.Vector3(this.position.x, this.position.y + 1, 0));
    floatScoreActor.addBehavior(NumberBehavior, { "value": value, "displayPlus": true });
    floatScoreActor.addBehavior(FloatUpBehavior);
  }
}
Sup.registerBehavior(PickUpBehavior);

class BossBehavior extends Sup.Behavior {
  speed = 0.04;
  width = 1.9;
  height = 1.9;
  changeStateTimer: number;
  changeStateDelays = { "Idle": 30, "Chase": 90, "Cooldown": 30 };

  hitSpeed = 0;
  minHitSpeed = 0.05;
  maxHitSpeed = 0.25;

  bodyActor: Sup.Actor;
  bodyRndr: Sup.SpriteRenderer;
  shadowActor: Sup.Actor;
  shadowScale = new Sup.Math.Vector3(2, 2, 2);

  state = "Jump";
  avoidWater = true;

  justSpawned = true;
  spawnPosition: Sup.Math.Vector3;
  spawnMoveVector: Sup.Math.Vector3;

  position: Sup.Math.Vector3;
  direction = new Sup.Math.Vector3(0, 0, 0);
  lastDirection = new Sup.Math.Vector3(0, 0, 0);
  keepDirection = false;

  jumpMoveVector = new Sup.Math.Vector3(0, 0, 0);
  jumpPosition = new Sup.Math.Vector3(0, 0, 0);
  jumpSpeed = 0.08;
  
  start() {
    this.position = this.actor.getLocalPosition();
    this.spawnPosition = this.position.clone();

    this.shadowActor = new Sup.Actor("Shadow", this.actor);
    this.shadowActor.setLocalPosition(new Sup.Math.Vector3(0, 0, -0.1));
    new Sup.SpriteRenderer(this.shadowActor, Sup.get("Effects/Shadow", Sup.Sprite));
    this.bodyActor = new Sup.Actor("Body", this.actor);
    this.bodyRndr = new Sup.SpriteRenderer(this.bodyActor, Sup.get("Enemies/Bionic Yeti", Sup.Sprite));
    (<any>Game.enemies).push(this);
    
    // Jump initialisation
    if (Math.floor(this.position.x) > Game.map.getWidth() / 2) this.jumpMoveVector.x = -1;
    else this.jumpMoveVector.x = 1;

    if (Math.floor(this.position.y) > Game.map.getHeight() / 2) this.jumpMoveVector.y = -1;
    else this.jumpMoveVector.y = 1;
    this.jumpMoveVector.normalize();
    
    this.spawnMoveVector = this.jumpMoveVector.clone().multiplyScalar(0.02);
    let initialOffset = this.jumpMoveVector.clone().multiplyScalar(2);
    this.jumpMoveVector.multiplyScalar(0.1);
    
    this.position.subtract(initialOffset);
    this.actor.setLocalPosition(this.position);
    
    let scale = new Sup.Math.Vector3(1, 1, 1);
    if (this.position.x > Game.map.getWidth() / 2) scale.x = -1;
    this.actor.setLocalScale(scale)
  }

  update() {
    if (this.state === "Jump" && ! this.justSpawned) {
      this.jump();
      return;
    }
    
    if (this.justSpawned) {
      this.spawnedMovement();
      return;
    }
    
    this.bodyActor.spriteRenderer.setColor(new Sup.Color(1, 1, 1));
    if (this.hitSpeed > this.minHitSpeed) {
      let hitColor = new Sup.Color(1, 0.5, 0.5);
      this.bodyActor.spriteRenderer.setColor(hitColor);
      
      this.movement(-this.hitSpeed, false);
      this.hitSpeed *= 0.92;
    }
    
    else if (this.state === "Attack") {
      this.checkHitPlayer();
      if (! this.bodyRndr.isAnimationPlaying()) {
        this.state = "Cooldown";
        this.changeStateTimer = this.changeStateDelays[this.state] * (1 + Sup.Math.Random.integer(1, 5) / 10);
        this.bodyRndr.setAnimation("Idle");
      }
    }
    
    else if (this.state === "Attack2") {
      if (! this.bodyRndr.isAnimationPlaying()) {
        let index = 6 + Sup.Math.Random.integer(0, 10);
        while (index >= 0) {
          this.spawnRock();
          index -= 1;
        }
        
        this.state = "Cooldown";
        this.changeStateTimer = this.changeStateDelays[this.state] * (1 + Sup.Math.Random.integer(1, 5) / 10);
        this.bodyRndr.setAnimation("Idle");
      }
    }
    
    else if (Game.playerActor.getBehavior(PlayerBehavior).isDead) this.bodyRndr.setAnimation("Idle");
      
    else {
      this.changeStateTimer -= 1;
      if (this.changeStateTimer <= 0) {
        if (this.state === "Chase") {
          this.state = "Attack2";
          this.bodyRndr.setAnimation("Attack2", false);
        }
        else {
          this.state = "Chase";
          this.changeStateTimer = this.changeStateDelays[this.state] * (1 + Sup.Math.Random.integer(1, 5) / 10);
          this.bodyRndr.setAnimation("Chase");
        }
      }
      if (this.state === "Chase") {
        this.checkAttack();
        this.movement(this.speed, this.avoidWater);
      }
      
      else if (this.state === "Idle") this.checkAttack();
    }
    let canFallAtTopLeft = Autotiling.canFallAt(Math.floor(this.position.x - 0.6), Math.floor(this.position.y + 0.6));
    let canFallAtBottomLeft = Autotiling.canFallAt(Math.floor(this.position.x - 0.6), Math.floor(this.position.y - 0.6));
    let canFallAtTopRight = Autotiling.canFallAt(Math.floor(this.position.x + 0.6), Math.floor(this.position.y + 0.6));
    let canFallAtBottomRight = Autotiling.canFallAt(Math.floor(this.position.x + 0.6), Math.floor(this.position.y - 0.6));
    
    if (canFallAtTopLeft && canFallAtBottomLeft && canFallAtTopRight && canFallAtBottomRight && this.jumpPosition.y === 0) this.die();
  }

  // Actions
  jump() {
    this.jumpSpeed = Math.max(-0.25, this.jumpSpeed - 0.006);

    this.jumpPosition.y = Math.max(0, this.jumpPosition.y + this.jumpSpeed);
    this.bodyActor.setLocalPosition(this.jumpPosition);
    this.shadowScale.x = 2 - this.jumpPosition.y / 1.5;
    this.shadowScale.y = 2 - this.jumpPosition.y / 1.5;
    this.shadowActor.setLocalScale(this.shadowScale);

    this.position.add(this.jumpMoveVector);
    this.actor.setLocalPosition(this.position);
    this.bodyActor.setLocalPosition(this.jumpPosition);
    this.bodyRndr.setAnimation(null);

    if (this.jumpPosition.y === 0) {
      this.state = "Idle";
      this.changeStateTimer = this.changeStateDelays[this.state] * (1 + Sup.Math.Random.integer(1, 5) / 10);
    }
  }
  
  spawnedMovement() {
    this.position.add(this.spawnMoveVector);
    
    if (this.position.distanceTo(this.spawnPosition) < 1.5 * this.spawnMoveVector.length()) {
      this.position.copy(this.spawnPosition);
      this.justSpawned = false;
    }
    
    this.actor.setLocalPosition(this.position);
    this.bodyRndr.setAnimation("Chase");
  }
  
  checkAttack() {
    let playerPosition = Game.playerActor.getLocalPosition();
    
    let angle = Math.atan2(playerPosition.y - this.position.y, playerPosition.x - this.position.x);
    this.direction.x = Math.cos(angle);
    this.direction.y = Math.sin(angle);
    
    // Check distance with the player
    let distance = playerPosition.distanceTo(this.position);
    if (distance < 1) {
      this.state = "Attack";
      this.bodyRndr.setAnimation("Attack", false)
    }
  }
  
  movement(speed: number, avoidWater: boolean) {
    let playerPosition = Game.playerActor.getLocalPosition();
    
    let angle = Math.atan2(playerPosition.y - this.position.y, playerPosition.x - this.position.x);
    this.direction.x = Math.cos(angle);
    this.direction.y = Math.sin(angle);
  
    let scale = new Sup.Math.Vector3(1, 1, 1);
    if (this.direction.x < 0) scale.x = -1;
    this.actor.setLocalScale(scale);
    
    let moveVector = this.direction.clone().multiplyScalar(speed);
    Collision.move(this.position, this.width, this.height, moveVector, avoidWater);
    
    if (Math.abs(moveVector.x) < speed / 10) {
      moveVector.x = 0;
      if(moveVector.y != 0) moveVector.y = moveVector.y / Math.abs(moveVector.y) * speed;
      Collision.move(this.position, this.width, this.height, moveVector, avoidWater)
    }
      
    else if (Math.abs(moveVector.y) < speed / 10) {
      moveVector.y = 0;
      if(moveVector.x != 0) moveVector.x = moveVector.x / Math.abs(moveVector.x) * speed;
      Collision.move(this.position, this.width, this.height, moveVector, avoidWater);
    }
    
    if (this.keepDirection) {
      if ((this.lastDirection.x === 0 && moveVector.x !== 0) || (this.lastDirection.y === 0 && moveVector.y !== 0)) this.keepDirection = false;
      
      moveVector.copy(this.lastDirection);
      Collision.move(this.position, this.width, this.height, moveVector, avoidWater);
    }
    
    else if (this.state === "Chase") {
      let diffAngle = Math.round(Math.abs(Math.atan2(moveVector.y, moveVector.x) - Math.atan2(this.lastDirection.y, this.lastDirection.x)));
      if (diffAngle === 180) this.keepDirection = true;
    }
        
    this.lastDirection.copy(moveVector);
      
    this.position.add(moveVector);
    this.actor.setLocalPosition(this.position);
    
    // Avoid stacking with other enemies
    /*
    let i = 0;
    let diff = new Sup.Math.Vector3(0,0,0);
    while (i < Game.enemies.length) {
      let enemy = Game.enemies[i];
      i += 1;
      
      if (enemy == this) continue;
      
      diff.copy(this.position).subtract(enemy.position);
      if (diff.length() === 0) diff.set(Sup.Math.Random.integer(-1, 1) / 20, Sup.Math.Random.integer(-1, 1) / 20, 0);
      
      if (diff.length() < 0.5) {
        diff.normalize().multiplyScalar(0.01);
        Collision.move(this.position, this.width, this.height, diff);
        this.position.add(diff);
        this.actor.setLocalPosition(this.position);
      }
    }*/
  }
  
  spawnRock() {
    let rockActor = new Sup.Actor("Rock");
    
    // Place it at a random location
    let position = new Sup.Math.Vector3(0, 0, 0.2);
    while (Game.map.getTileAt(0, position.x, position.y) === 0 || Game.map.getTileAt(0, position.x, position.y) === 13 || this.position.distanceTo(position) < 5) {
      position.x = Sup.Math.Random.integer(1, Game.map.getWidth()) - 1;
      position.y = Sup.Math.Random.integer(1, Game.map.getHeight()) - 1;
    }
    
    position.x += 0.5;
    position.y += 0.5;
    
    rockActor.setLocalPosition(position);
    rockActor.addBehavior(RockBehavior);
  }
  
  checkHitPlayer() {
    // Check distance with the player
    let playerPosition = Game.playerActor.getLocalPosition();
    let diffToPlayer = playerPosition.clone().subtract(this.position);
    if (diffToPlayer.length() < 1.2) Game.playerActor.getBehavior(PlayerBehavior).hit(diffToPlayer.normalize());
  }
  
  hit(power: number, multiplier: number) {
    if (this.hitSpeed > this.minHitSpeed) return;

    this.keepDirection = false;
    this.hitSpeed = this.maxHitSpeed * (2 + power) / 3 * multiplier;
  }
  
  die() {
    Sup.Audio.playSound("Effects/Water Splash");
      
    // Ice cube && splash
    let splashPosition = new Sup.Math.Vector3(Math.floor(this.position.x) + 0.5, Math.floor(this.position.y) + 0.5, -0.1);

    let iceCubeActor = new Sup.Actor("Ice Cube");
    iceCubeActor.setLocalPosition(splashPosition);
    iceCubeActor.addBehavior(IceCubeBehavior);

    let splashActor = new Sup.Actor("Splash");
    splashPosition.z += 0.05;
    splashActor.setLocalPosition(splashPosition);
    splashActor.addBehavior(SplashBehavior);

    // Spawn some loot
    let loots = [ { "name": "Gem", "value": 50 }, { "name": "Coin", "value": 10 } ];

    let i = 0;
    let quantity = Sup.Math.Random.integer(3, 5);
    while (i < quantity) {
      let loot = loots[Sup.Math.Random.integer(0, loots.length - 1)];
      let pickUpActor = new Sup.Actor(loot.name);
      pickUpActor.setLocalPosition(new Sup.Math.Vector3(splashPosition.x, splashPosition.y, -0.2));

      let pickUpBehavior = pickUpActor.addBehavior(PickUpBehavior);

      let angle = Sup.Math.Random.integer(0, 359);
      let speed = 0.06 + Sup.Math.Random.integer(1, 6) / 100;
      pickUpBehavior.speed = new Sup.Math.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0);

      pickUpBehavior.sprite = loot.name;
      pickUpBehavior.scoreValue = loot.value;
      i += 1;
    }

    // Remove enemy
    Game.enemies.splice((<any>Game.enemies).indexOf(this), 1);
    this.actor.destroy();
  }
}
Sup.registerBehavior(BossBehavior);
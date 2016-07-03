class EnemyBehavior extends Sup.Behavior {
  type: string;
  speed: number;
  width: number;
  height: number;
  changeStateTimer: number;
  changeStateDelays: { [key: string]: number; };

  hitSpeed: number;
  minHitSpeed: number;
  maxHitSpeed: number;

  bodyActor: Sup.Actor;
  bodyRndr: Sup.SpriteRenderer;
  shadowActor: Sup.Actor;
  shadowScale: Sup.Math.Vector3;

  state: string;
  fly: boolean;
  avoidWater: boolean;
  charge: number;

  justSpawned: boolean;
  spawnPosition: Sup.Math.Vector3;
  spawnMoveVector: Sup.Math.Vector3;

  position: Sup.Math.Vector3;
  direction: Sup.Math.Vector3;
  lastDirection: Sup.Math.Vector3;
  keepDirection: boolean;

  jumpMoveVector: Sup.Math.Vector3;
  jumpPosition: Sup.Math.Vector3;
  jumpSpeed: number;
  
  awake() {
    this.changeStateDelays = { "Idle": 60, "Chase": 180, "Cooldown": 30,  "Stun": 80, "Charge": 60 };
    
    this.hitSpeed = 0;
    this.minHitSpeed = 0.05;
    this.maxHitSpeed = 0.25;
    
    this.shadowScale = new Sup.Math.Vector3(1, 1, 1);
    
    this.state = "Jump";
    
    this.justSpawned = true;
    
    this.direction = new Sup.Math.Vector3(0, 0, 0);
    this.lastDirection = new Sup.Math.Vector3(0, 0, 0);
    this.keepDirection = false;
    
    this.jumpMoveVector = new Sup.Math.Vector3(0, 0, 0);
    this.jumpPosition = new Sup.Math.Vector3(0, 0, 0);
    this.jumpSpeed = 0.08;
  }
  
  start() {
    this.position = this.actor.getLocalPosition();
    this.spawnPosition = this.position.clone();
    
    this.shadowActor = new Sup.Actor("Shadow", this.actor);
    this.shadowActor.setLocalPosition(new Sup.Math.Vector3(0, 0, -0.1))
    new Sup.SpriteRenderer(this.shadowActor, Sup.get("Effects/Shadow", Sup.Sprite))
    this.bodyActor = new Sup.Actor("Body", this.actor);
    this.bodyRndr = new Sup.SpriteRenderer(this.bodyActor, Sup.get("Enemies/" + this.type, Sup.Sprite));
    Game.enemies.push(this)
    
    // Jump initialisation
    this.jumpMoveVector.x = (Math.floor(this.position.x) > Game.map.getWidth() / 2) ? -1 : 1;
    this.jumpMoveVector.y = (Math.floor(this.position.y) > Game.map.getHeight() / 2) ? -1 : 1;
    this.jumpMoveVector.normalize()
    
    this.spawnMoveVector = this.jumpMoveVector.clone().multiplyScalar(0.02);
    let initialOffset = this.jumpMoveVector.clone().multiplyScalar(2);
    this.jumpMoveVector.multiplyScalar(0.1);
    
    this.position.subtract(initialOffset);
    this.actor.setLocalPosition(this.position);
    
    let scale = new Sup.Math.Vector3(1, 1, 1);
    if (this.position.x > Game.map.getWidth() / 2) { scale.x = -1; }
    this.actor.setLocalScale(scale);
    
    if (this.fly) {
      this.state = "Chase";
      this.justSpawned = false;
    }
  }
  
  update() {
    if (this.state == "Jump" && ! this.justSpawned) {
      this.jump()
      return
    }
    
    if (this.justSpawned) {
      this.spawnedMovement()
      return
    }
    
    this.bodyActor.spriteRenderer.setColor(new Sup.Color(1, 1, 1));
    if (this.hitSpeed > this.minHitSpeed) {
      let hitColor = new Sup.Color(1, 0.5, 0.5);
      this.bodyActor.spriteRenderer.setColor(hitColor);
      
      this.movement(-this.hitSpeed, false);
      this.hitSpeed *= 0.92;
    }
    
    else if (this.state == "Hit") {
      this.state = "Stun";
      this.changeStateTimer = this.changeStateDelays[this.state];
      
      let stunActor = new Sup.Actor("Stun", this.actor);
      let stunPosition = new Sup.Math.Vector3(0, this.height, 0.1);
      stunActor.setLocalPosition(stunPosition);
      let stunBehavior = stunActor.addBehavior(StunBehavior);
      stunBehavior.duration = this.changeStateDelays[this.state];
    }
    
    else if (this.state == "Attack") {
      if (! this.bodyRndr.isAnimationPlaying()) {
        this.state = "Cooldown";
        this.changeStateTimer = this.changeStateDelays[this.state] * (1 + Sup.Math.Random.integer(1, 5) / 10);
      }
      else {
        this.movement(0.1, this.avoidWater);
        this.checkHitPlayer();
      }
    }
    else if (Game.playerActor.getBehavior(PlayerBehavior).isDead) this.bodyRndr.setAnimation("Idle");
      
    else {
      this.changeStateTimer -= 1;
      if (this.changeStateTimer <= 0) {
        if (this.state == "Charge") this.state = "Cooldown";
        else if (this.state == "Chase") this.state = "Idle";
        else this.state = "Chase";
          
        this.changeStateTimer = this.changeStateDelays[this.state] * (1 + Sup.Math.Random.integer(1, 5) / 10);
      }
      if (this.state == "Charge") {
        this.movement(this.charge, false);
        this.checkHitPlayer();
      } 
      else if (this.state == "Chase") {
        this.checkAttack();
        this.movement(this.speed, this.avoidWater);
      }
      
      else if (this.state == "Idle") this.checkAttack();
      
      if (this.state !== "Attack") {
        let animation = this.state;
        if (this.state == "Cooldown") { animation = "Idle"; }
        this.bodyRndr.setAnimation(animation)
      }
    }
    
    if (Autotiling.canFallAt(Math.floor(this.position.x), Math.floor(this.position.y)) && this.jumpPosition.y == 0 && ! this.fly) this.die();
  }
  
  // Actions
  jump() {
    this.jumpSpeed = Math.max(-0.25, this.jumpSpeed - 0.006);

    this.jumpPosition.y = Math.max(0, this.jumpPosition.y + this.jumpSpeed);
    this.bodyActor.setLocalPosition(this.jumpPosition)
    this.shadowScale.x = 1 - this.jumpPosition.y / 1.5;
    this.shadowScale.y = 1 - this.jumpPosition.y / 1.5;
    this.shadowActor.setLocalScale(this.shadowScale)

    this.position.add(this.jumpMoveVector)
    this.actor.setLocalPosition(this.position)
    this.bodyActor.setLocalPosition(this.jumpPosition)
    this.bodyRndr.setAnimation(null)

    if (this.jumpPosition.y == 0) {
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
    if (this.charge == 0) {
      if (distance < 1) {
        this.state = "Attack";
        this.bodyRndr.setAnimation("Attack", false);
      }
    }
    else {
      if (distance < 5) {
        let inMapX = Math.floor(this.position.x);
        let inMapY = Math.floor(this.position.y);
        
        // Check no water around
        let y = -1;
        while (y <= 1) {
          let x = -1;
          while (x <= 1) {
            if (Autotiling.isWaterAt(inMapX + x, inMapY + y)) { return }
            x += 1
          }
          y += 1
        }
        
        // Check the path is clear
        let x1: number;
        let x2: number;
        let y1: number;
        let y2: number;
        
        if (this.position.x < playerPosition.x) {
          x1 = inMapX;
          x2 = Math.floor(playerPosition.x);
        }
        else {
          x1 = Math.floor(playerPosition.x);
          x2 = inMapX;
        }
        
        if (this.position.y < playerPosition.y) {
          y1 = inMapY;
          y2 = Math.floor(playerPosition.y);
        }
        else {
          y1 = Math.floor(playerPosition.y);
          y2 = inMapY;
        }
        
        let e  = x2 - x1;
        let dx = e * 2;
        let dy = (y2 - y1) * 2;
        while (x1 <= x2) {
          if (Collision.isBlockedAt(x1, y1, true)) { return }
            
          x1 += 1;
          if (e <= dy) {
            y1 += 1;
            e += dx;
          }
        }
        
        this.state = "Charge";
        this.bodyRndr.setAnimation("Charge", true)
        this.changeStateTimer = this.changeStateDelays[this.state] * (1 + Sup.Math.Random.integer(0, 2) / 10);
      }
    }
  }

  checkHitPlayer() {
    // Check distance with the player
    let playerPosition = Game.playerActor.getLocalPosition();
    let diffToPlayer = playerPosition.clone().subtract(this.position);
    if (diffToPlayer.length() < 0.5) {
      Game.playerActor.getBehavior(PlayerBehavior).hit(diffToPlayer.normalize())
    }
  }
  
  movement(speed: number, avoidWater: boolean) {
    let scale = new Sup.Math.Vector3(1, 1, 1);
    if (this.direction.x < 0) { scale.x = -1; }
    this.actor.setLocalScale(scale);
    
    let moveVector = this.direction.clone().multiplyScalar(speed);
    if (! this.fly) { Collision.move(this.position, this.width, this.height, moveVector, avoidWater); }
      
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
      if ((this.lastDirection.x == 0 && moveVector.x != 0) || (this.lastDirection.y == 0 && moveVector.y != 0)) { this.keepDirection = false; }
      moveVector.copy(this.lastDirection);
      Collision.move(this.position, this.width, this.height, moveVector, avoidWater);
    }
    
    else if (this.state == "Chase") {
      let diffAngle = Math.round(Math.abs(Math.atan2(moveVector.y, moveVector.x) - Math.atan2(this.lastDirection.y, this.lastDirection.x)));
      if (diffAngle == 180) { this.keepDirection = true; }
    }
        
    this.lastDirection.copy(moveVector);
    this.position.add(moveVector);
    this.actor.setLocalPosition(this.position);
    
    // Avoid stacking with other enemies
    let i = 0;
    let diff = new Sup.Math.Vector3(0,0,0);
    while (i < Game.enemies.length) {
      let enemy = Game.enemies[i];
      i += 1
      if (enemy == this) { continue }
        
      diff.copy(this.position).subtract(enemy.position);
      if (diff.length() == 0) { diff.set(Sup.Math.Random.integer(-1, 1) / 20, Sup.Math.Random.integer(-1, 1) / 20, 0); }
        
      if (diff.length() < 0.5) {
        diff.normalize().multiplyScalar(0.01);
        Collision.move(this.position, this.width, this.height, diff, false);
        this.position.add(diff);
        this.actor.setLocalPosition(this.position);
      }
    }
  }
  hit(power: number, multiplier: number) {
    if (this.hitSpeed > this.minHitSpeed) { return }
      
    if (this.fly) {
      this.fly = false;
      this.bodyRndr.setSprite(Sup.get("Enemies/Small", Sup.Sprite));
    }
    
    this.jumpPosition.y = 0;
    this.bodyActor.setLocalPosition(this.jumpPosition);
    
    this.keepDirection = false;
    this.hitSpeed = this.maxHitSpeed * (2 + power) / 3 * multiplier;
    this.bodyRndr.setAnimation("Stun")

    // Hit state allow to pass to Stun state when the knockback is over. Only possible when max power
    if (power == 1) { this.state = "Hit"; }
    else {
      this.state = "Idle";
      this.changeStateTimer = this.changeStateDelays[this.state] * (0.5 + Sup.Math.Random.integer(1, 5) / 10);
    }
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
    let loots = [ { "name": "Big Gem", "value": 100 }, { "name": "Gem", "value": 50 }, { "name": "Coin", "value": 10 } ];

    let i = 0;
    let quantity = Sup.Math.Random.integer(3, 5);
    while (i < quantity) {
      let loot = loots[Sup.Math.Random.integer(0, loots.length - 1)];
      let pickUpActor = new Sup.Actor(loot.name);
      pickUpActor.setLocalPosition(new Sup.Math.Vector3(splashPosition.x, splashPosition.y, 3));

      let pickUpBehavior = pickUpActor.addBehavior(PickUpBehavior);

      let angle = Sup.Math.Random.integer(0, 359);
      let speed = 0.06 + Sup.Math.Random.integer(1, 6) / 100;
      pickUpBehavior.speed = new Sup.Math.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0);

      pickUpBehavior.sprite = loot.name;
      pickUpBehavior.scoreValue = loot.value;
      i += 1;
    }

    // Remove enemy
    ;Game.enemies.splice(Game.enemies.indexOf(this), 1)
    this.actor.destroy()
      
    Game.hasKilledEnemy = true;
  }
  
}
Sup.registerBehavior(EnemyBehavior)
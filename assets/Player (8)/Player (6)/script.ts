class PlayerBehavior extends Sup.Behavior {
  isDead = false;
  
  acceleration: number;
  maxSpeed = 0.1;
  maxDiggingSpeed = 0.05;
  slowFactor = 0.93;

  width = 0.9;
  height = 0.5;

  digDuration = 30;
  isDeadDuration = 300;

  isDigging = false;
  isAttacking = false;
  attackLaunched = false;
  chargeTimer = 0;
  chargeDuration = 60;
  chargeMultiplier = 1;

  position = this.actor.getLocalPosition();
  speed = new Sup.Math.Vector3();
  knockback = new Sup.Math.Vector3();
  scale = new Sup.Math.Vector3(1);
  angle: number;

  jumpPosition = new Sup.Math.Vector3();
  jumpSpeed = 0;

  orientation = new Sup.Math.Quaternion();

  camera = Sup.getActor("Camera").camera;
  targetTile = { x: -1, y: -1 };
  digTimer = 0;
  isDeadTimer = -1;

  bodyActor: Sup.Actor;
  headActor: Sup.Actor;
  shadowActor: Sup.Actor;
  shadowScale = new Sup.Math.Vector3(1);

  armPivotActor: Sup.Actor;
  armActor: Sup.Actor;
  armPosition: Sup.Math.Vector3;

  digFXActor: Sup.Actor;
  digTargetActor: Sup.Actor;
  chargeFXActor: Sup.Actor;
  attackFXActor: Sup.Actor;
  attackFXscale: Sup.Math.Vector3;

  footStepsInstance: Sup.Audio.SoundPlayer;
  diggingInstance: Sup.Audio.SoundPlayer;
  releasePunchInstance: Sup.Audio.SoundPlayer;
  punchInstance: Sup.Audio.SoundPlayer;
  jumpInstance: Sup.Audio.SoundPlayer;

  heartActors: Array<Sup.Actor>;
  health: number;
  invincibilityTimer = 0;
  invincibilityDuration = 30;
  
  awake() {
    this.acceleration = 0.01;
    
    this.footStepsInstance = new Sup.Audio.SoundPlayer("Player/Foot Steps").setVolume(0.1);
    this.diggingInstance = new Sup.Audio.SoundPlayer("Player/Digging").setVolume(0.3).setLoop(true);
    this.releasePunchInstance = new Sup.Audio.SoundPlayer("Player/Release Punch").setVolume(0.4);
    this.punchInstance = new Sup.Audio.SoundPlayer("Player/Punch 1");
    this.jumpInstance = new Sup.Audio.SoundPlayer("Player/Jump");
    
    this.bodyActor = Sup.getActor("Body");
    this.headActor = Sup.getActor("Head");
    this.shadowActor = Sup.getActor("Shadow");
    this.armPivotActor = Sup.getActor("Arm Pivot");
    this.armActor = Sup.getActor("Arm");
    this.armPosition = this.armActor.getLocalPosition();
    
    let initialScale = new Sup.Math.Vector3(0.01);
    this.digFXActor = Sup.getActor("Dig FX");
    this.digFXActor.setLocalScale(initialScale);
    
    this.digTargetActor = Sup.getActor("Dig Target");
    this.digTargetActor.setLocalScale(initialScale);
    
    this.chargeFXActor = Sup.getActor("Charge FX");
    this.chargeFXActor.setLocalScale(initialScale);
    
    this.attackFXActor = Sup.getActor("Attack FX");
    this.attackFXscale = this.attackFXActor.getLocalScale();
    this.attackFXActor.setLocalScale(initialScale);
    
    this.heartActors = Sup.getActor("Hearts").getChildren();
    this.health = this.heartActors.length;
  }
    
  update() {
    if (! Game.started) {
      this.bodyActor.spriteRenderer.setAnimation(null);
      this.armActor.spriteRenderer.setAnimation(null);
      return
    }
    
    Game.updateTutorial();
    
    if (this.isDead) {
      if (this.knockback.length() > 0.01) {
        Collision.move(this.position, this.width, this.height, this.knockback, false);
        this.position.add(this.knockback);
        this.actor.setLocalPosition(this.position);
        this.knockback.multiplyScalar(0.95);
      }
      this.isDeadTimer -= 1;
      
      if (this.isDeadTimer === 0) Game.finish();
      return
    }
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= 1;
      
      let hitColor = new Sup.Color(1, 0.5, 0.5);
      this.bodyActor.spriteRenderer.setColor(hitColor);
      this.headActor.spriteRenderer.setColor(hitColor);
      this.armActor.spriteRenderer.setColor(hitColor);
    }
    else {
      this.bodyActor.spriteRenderer.setColor(1, 1, 1);
      this.headActor.spriteRenderer.setColor(1, 1, 1);
      this.armActor.spriteRenderer.setColor(1, 1, 1);
    }
    if (!this.isDigging) {
      if ((Sup.Input.isMouseButtonDown(0) || Sup.Input.isGamepadButtonDown(0, 7)) && !this.isAttacking && !this.attackLaunched && !this.isInShip()) {
        this.isDigging = true;
        this.armActor.spriteRenderer.setSprite("Player/Drill");
        this.armActor.spriteRenderer.setAnimation("Animation");
      }
    }
    else if (Sup.Input.wasMouseButtonJustReleased(0) || Sup.Input.wasGamepadButtonJustReleased(0, 7) || this.isInShip()) {
      this.isDigging = false;
      this.armActor.spriteRenderer.setAnimation(null);
    }
    
    if (! this.isAttacking) {
      if ((Sup.Input.isMouseButtonDown(2) || Sup.Input.isGamepadButtonDown(0, 6)) && ! this.isDigging && ! this.attackLaunched && ! this.isInShip()) {
        this.isAttacking = true;
        this.chargeTimer = 0;
        this.armActor.spriteRenderer.setSprite("Player/Fist");
        this.armActor.spriteRenderer.setAnimation("Charge");
      }
    }
    else {
      if (Sup.Input.wasMouseButtonJustReleased(2) || Sup.Input.wasGamepadButtonJustReleased(0, 6) || this.isInShip()) {
        this.armActor.spriteRenderer.setAnimation("Attack", false);
        this.isAttacking = false;
        this.attackLaunched = true;
        this.releasePunchInstance.play();
        
        this.chargeFXActor.setLocalScale(new Sup.Math.Vector3(0.01));
        
        if (this.chargeTimer == this.chargeDuration) {
          this.attackFXActor.setLocalScale(this.attackFXscale);
          this.attackFXActor.spriteRenderer.setAnimation("Animation", false);
        }
      }
      else {
        this.chargeTimer = Math.min(this.chargeDuration, this.chargeTimer + 1);
        
        if (this.chargeTimer == 10) {
          this.chargeFXActor.setLocalScale(new Sup.Math.Vector3(1));
          this.chargeFXActor.spriteRenderer.setAnimation("Charge", false);
        }
        
        if (this.chargeTimer == this.chargeDuration) {
          this.chargeFXActor.spriteRenderer.setAnimation("Charge Complete");
        }
      }
    }
    if (! this.attackFXActor.spriteRenderer.isAnimationPlaying()) {
      this.attackFXActor.setLocalScale(new Sup.Math.Vector3(0.01));
    }
    
    if (this.attackLaunched) {
      if (! this.armActor.spriteRenderer.isAnimationPlaying()) {
        this.armActor.spriteRenderer.setSprite("Player/Drill")
        this.attackLaunched = false;
      }
      
      else if (this.armActor.spriteRenderer.getAnimationFrameTime() / this.armActor.spriteRenderer.getAnimationFrameCount() < 0.8) {
        this.attack();
      }
    }
    
    this.movement();
    this.dig();
    
    if (this.isInShip()) {
      this.actor.setLocalScale(new Sup.Math.Vector3(0.01));
      Game.shopBehavior.open();
    }
    else {
      this.actor.setLocalScale(this.scale);
      Game.shopBehavior.close();
    }
    
    if (this.jumpPosition.y == 0) {
      let canFallUpLeft = Autotiling.canFallAt(Math.floor(this.position.x - 0.5 / 2), Math.floor(this.position.y + 0.2 / 2));
      let canFallBottomLeft = Autotiling.canFallAt(Math.floor(this.position.x - 0.5 / 2), Math.floor(this.position.y - 0.2 / 2));
      let canFallUpRight = Autotiling.canFallAt(Math.floor(this.position.x + 0.5 / 2), Math.floor(this.position.y + 0.2 / 2));
      let canFallBottomRight = Autotiling.canFallAt(Math.floor(this.position.x + 0.5 / 2), Math.floor(this.position.y - 0.2 / 2));

      if (canFallUpLeft && canFallBottomLeft && canFallUpRight && canFallBottomRight) this.fall();
    }
  }
  
  movement() {
    let isMoving = false;
  
    if (!Game.usingGamepad) {
      if (Sup.Input.isKeyDown("Z") || Sup.Input.isKeyDown("W")) {
        this.speed.y += this.acceleration;
        isMoving = true;
      }
      else if (Sup.Input.isKeyDown("S")) {
        this.speed.y -= this.acceleration;
        isMoving = true;
      }
      
      if (Sup.Input.isKeyDown("Q") || Sup.Input.isKeyDown("A")) {
        this.speed.x -= this.acceleration;
        isMoving = true;
      }
      else if (Sup.Input.isKeyDown("D")) {
        this.speed.x += this.acceleration;
        isMoving = true;
      }
    }
    else {
      if (Sup.Input.getGamepadAxisValue(0, 1) !== 0) {
        this.speed.y -= this.acceleration * Sup.Input.getGamepadAxisValue(0, 1);
        isMoving = true;
      }
      if (Sup.Input.getGamepadAxisValue(0, 0) !== 0) {
        this.speed.x += this.acceleration * Sup.Input.getGamepadAxisValue(0, 0);
        isMoving = true;
      }
    }
    let length = this.speed.length();
    if (length !== 0) {
      let maxSpeed = this.maxSpeed;
      if (this.isDigging) maxSpeed = this.maxDiggingSpeed;
        
      length = Math.min(length, maxSpeed);
      this.speed.normalize().multiplyScalar(length);
    }
    let movementOffset = this.speed.clone().add(this.knockback);
    length = movementOffset.length();

    let animation = "none";
    if (length > 0.01) {
      Collision.move(this.position, this.width, this.height, movementOffset, false)
      if (movementOffset.length() > 0.01) {
        this.position.add(movementOffset);
        animation = "Walk";
        this.footStepsInstance.play();
      }
      else this.footStepsInstance.stop();
    }
    this.actor.setLocalPosition(this.position);
    
    if (!isMoving) this.speed.multiplyScalar(this.slowFactor);
    this.knockback.multiplyScalar(0.95)
    
    this.jumpSpeed = Math.max(-0.25, this.jumpSpeed - 0.006);
    if (this.jumpPosition.y === 0 && (Sup.Input.wasKeyJustPressed("SPACE") || Sup.Input.wasGamepadButtonJustPressed(0, 0))) {
      this.jumpSpeed = 0.08;
      this.jumpInstance.play();
    }
    
    this.jumpPosition.y = Math.max(0, this.jumpPosition.y + this.jumpSpeed);
    this.bodyActor.setLocalPosition(this.jumpPosition)
    this.shadowScale.x = 1 - this.jumpPosition.y / 1.5;
    this.shadowScale.y = 1 - this.jumpPosition.y / 1.5;
    this.shadowActor.setLocalScale(this.shadowScale);
    
    if (this.jumpPosition.y !== 0) animation = "Jump";
    this.bodyActor.spriteRenderer.setAnimation(animation !== "none" ? animation : null);
  }
    
  dig() {
    let mousePositionScreen = Sup.Input.getMousePosition();
    let mousePosition = new Sup.Math.Vector3(mousePositionScreen.x, mousePositionScreen.y, 0);
    mousePosition.unproject(this.camera);
    
    let xDiff: number;
    let yDiff: number;
    if (!Game.usingGamepad) {
      xDiff = mousePosition.x - this.position.x;
      yDiff = mousePosition.y - this.position.y;
    }
    else {
      xDiff = Sup.Input.getGamepadAxisValue(0, 2);
      yDiff = -Sup.Input.getGamepadAxisValue(0, 3);
    }
      
    if (!Game.usingGamepad || (Sup.Input.getGamepadAxisValue(0, 2) !== 0 && Sup.Input.getGamepadAxisValue(0, 3) !== 0)) {
      this.scale.x = (xDiff >= 0) ? 1 : -1;
      this.angle = Math.atan2(yDiff, xDiff);
      
      let armAngle: number;
      if (this.scale.x === 1) { armAngle = Math.atan2(yDiff, xDiff); }
      else { armAngle = Math.atan2(yDiff, -xDiff); }
      
      this.orientation.setFromYawPitchRoll(0, 0, armAngle);
      this.armPivotActor.setOrientation(this.orientation);
    }
    else {
      xDiff = Math.cos(this.angle);
      yDiff = Math.sin(this.angle);
    }
      
    this.actor.setLocalScale(this.scale);
    
    let offsetX = 0;
    let offsetY = 0;

    if (Math.abs(xDiff) > 0.5) offsetX = (xDiff >= 0) ? 1 : -1;
    if (Math.abs(yDiff) > 0.5) offsetY = (yDiff >= 0) ? 1 : -1;
      
    if (offsetX === 0 && offsetY === 0) {
      if (Math.abs(xDiff) > Math.abs(yDiff)) offsetX = (xDiff >= 0) ? 1 : -1;
      else offsetY = (yDiff >= 0) ? 1 : -1;
    }
    let targetTileX = Math.floor(this.position.x) + offsetX;
    let targetTileY = Math.floor(this.position.y) + offsetY;
    
    if (!Game.usingGamepad) {
      targetTileX = Math.floor(mousePosition.x);
      targetTileY = Math.floor(mousePosition.y);

      let mouseToPlayerX = Math.abs(targetTileX - Math.floor(this.position.x));
      let mouseToPlayerY = Math.abs(targetTileY - Math.floor(this.position.y));
      if (mouseToPlayerX > 1 || mouseToPlayerY > 1 || (mouseToPlayerX === 0 && mouseToPlayerY === 0)) {
        targetTileX = -1;
        targetTileY = -1;
      }
    }
    let canDigAtTarget = targetTileX != -1 && Autotiling.isIceAt(targetTileX, targetTileY);
    
    this.digTargetActor.setPosition(new Sup.Math.Vector3(targetTileX + 0.5, targetTileY + 0.5, -0.1));
    
    if (Sup.Input.wasMouseButtonJustReleased(0)) {
      Game.waterManager.addTile(this.targetTile.x, this.targetTile.y);
      
      this.digTimer = 0;
      this.targetTile.x = -1;
      this.targetTile.y = -1;
      this.armPosition.x = 0.1;
      this.armActor.setLocalPosition(this.armPosition);
    }
    if (this.isDigging) {
      this.digTimer += 1;
      
      this.armPosition.x = 0.1 - 0.02 * Math.sin(this.digTimer / this.digDuration * 3.14 * 1000);
      this.armActor.setLocalPosition(this.armPosition);
      
      this.digFXActor.setLocalScale(new Sup.Math.Vector3(1, 1, 1));
      this.digFXActor.setPosition(new Sup.Math.Vector3(targetTileX + 0.5, targetTileY + 0.5, 0));
      
      if (this.targetTile.x != targetTileX || this.targetTile.y != targetTileY) {
        Game.waterManager.addTile(this.targetTile.x, this.targetTile.y);
        
        if (canDigAtTarget) {
          let tile = Game.map.getTileAt(Game.iceLayer, targetTileX, targetTileY);
          this.digTimer = this.digDuration / Game.waterManager.digSteps * (tile - 1);
          this.targetTile.x = targetTileX;
          this.targetTile.y = targetTileY;
          
          Game.waterManager.removeTile(this.targetTile.x, this.targetTile.y);
        }
        else {
          this.targetTile.x = -1;
          this.targetTile.y = -1;
        }
      }  
      else if (canDigAtTarget) {
        if (this.digTimer >= this.digDuration) {
          this.digTimer = 0;

          Game.map.setTileAt(Game.waterLayer, targetTileX, targetTileY, 16);
          Autotiling.refreshWater(targetTileX, targetTileY);
          Autotiling.refreshWaterAround(targetTileX, targetTileY);
          
          Sup.Audio.playSound("Player/Breaking Ice", 0.5);
        }
        else if (this.digTimer % (this.digDuration / Game.waterManager.digSteps) == 0) {
          let tile = this.digTimer / this.digDuration * Game.waterManager.digSteps + 1;
          Game.map.setTileAt(Game.iceLayer, targetTileX, targetTileY, tile);
        }
      }
    }
    else this.digFXActor.setLocalScale(new Sup.Math.Vector3(0.01));

    if (canDigAtTarget) this.digTargetActor.setLocalScale(new Sup.Math.Vector3(1));
    else this.digTargetActor.setLocalScale(new Sup.Math.Vector3(0.01));
    
    if (this.targetTile.x === -1 || !this.isDigging) this.diggingInstance.stop();
    else this.diggingInstance.play();
  }
  
  attack() {
    let index = 0;
    while (index < Game.enemies.length) {
      let enemy = Game.enemies[index];
      
      let angle = Math.atan2(enemy.position.y - this.position.y, enemy.position.x - this.position.x);
      let distance = this.position.distanceTo(enemy.position);
      if ((Math.abs(angle - this.angle) < 30 || Math.abs(angle - this.angle - 360)) < 45 && distance < 2) {
        enemy.hit(this.chargeTimer / this.chargeDuration, this.chargeMultiplier);
        this.punchInstance.play();
      }
      index += 1;
    }
  }
  
  heal() {
    if (this.health === this.heartActors.length) return;
      
    this.heartActors[this.health].spriteRenderer.setAnimation("Full", false);
    this.health += 1;
  }
    
  hit(direction: Sup.Math.Vector3) {
    if (this.isDead || this.jumpPosition.y !== 0 || this.invincibilityTimer > 0) return;
      
    this.invincibilityTimer = this.invincibilityDuration;
    
    this.health -= 1;
    this.heartActors[this.health].spriteRenderer.setAnimation("Empty", false);
    
    this.knockback.add(direction.multiplyScalar(0.05));
    
    Sup.Audio.playSound("Player/Hit");
    
    if (this.health === 0) {
      Sup.Audio.playSound("Player/Die");
      this.die();
      
      this.bodyActor.spriteRenderer.setSprite(Sup.get("Player/Dead", Sup.Sprite));
      this.bodyActor.spriteRenderer.setAnimation("Animation", false);
      this.headActor.destroy();
      this.armPivotActor.destroy();
    }
  }
      
  fall() {
    if (this.isDead) return;
      
    this.die();
    this.bodyActor.destroy();
    
    Sup.Audio.playSound("Effects/Water Splash");
    
    let splashPosition = new Sup.Math.Vector3(Math.floor(this.position.x) + 0.5, Math.floor(this.position.y) + 0.5, -0.1);
    
    let iceCubeActor = new Sup.Actor("Ice Cube");
    iceCubeActor.setLocalPosition(splashPosition);
    iceCubeActor.addBehavior(IceCubeBehavior);
    
    let splashActor = new Sup.Actor("Splash");
    splashPosition.z += 0.05;
    splashActor.setLocalPosition(splashPosition);
    splashActor.addBehavior(SplashBehavior);
  }
  
  die() {
    this.footStepsInstance.stop();
    this.diggingInstance.stop();
  
    for (let heartActor of this.heartActors) heartActor.spriteRenderer.setAnimation("Empty", false);
    
    this.isDead = true;
    this.isDeadTimer = this.isDeadDuration;
      
    this.shadowActor.destroy();
    this.digFXActor.destroy();
    this.digTargetActor.destroy();
  }
  
  isInShip() {
    return Math.floor(this.position.x) === 10 && Math.floor(this.position.y) === 9
  }
  
  closeShip() {
    if (this.isInShip()) {
      this.position.y = 8.5;
      this.actor.setLocalPosition(this.position);
    }
  }
}
Sup.registerBehavior(PlayerBehavior);

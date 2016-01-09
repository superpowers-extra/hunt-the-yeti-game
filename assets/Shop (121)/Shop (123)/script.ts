class ShopBehavior extends Sup.Behavior {
  scale = new Sup.Math.Vector3(0.01, 0.01, 1);
  opened = false;

  buttons: Sup.Actor[];
  buttonAngles: number[];
  buttonNames = [ "Health", "Drill", "Boots", "Fist" ];
  buttonPrices = [ 300, 800, 500, 950 ];

  arrowActor: Sup.Actor;
    
  awake() {
    this.actor.setLocalScale(this.scale);
    
    this.buttons = this.actor.getChildren();
    this.buttonAngles = [];
    for (let index = 0; index < this.buttons.length; index++) {
      let button = this.buttons[index];
      let position = button.getLocalPosition();
      this.buttonAngles[index] = Math.atan2(position.y, position.x) * 180 / Math.PI;
      
      let price = new Sup.Actor("Price", button);
      price.setLocalPosition(new Sup.Math.Vector3(0.3, -0.5, 0.1));
      price.setLocalScale(new Sup.Math.Vector3(0.6, 0.6, 1));
      price.addBehavior(NumberBehavior, { value: this.buttonPrices[index] });
    }
  }
    
  update() {
    if (this.opened) {
      this.scale.x = Sup.Math.lerp(this.scale.x, 1, 0.2);
      this.scale.y = Sup.Math.lerp(this.scale.y, 1, 0.2);
      
      let x: number;
      let y: number;
      let canBuy = true;
      if (Game.usingGamepad) {
        x = Sup.Input.getGamepadAxisValue(0, 2);
        y = -Sup.Input.getGamepadAxisValue(0, 3);
        
        if (x == 0 && y == 0) canBuy = false;
      }
      else {
        let mousePosition = Sup.Input.getMousePosition();
        x = mousePosition.x;
        y = mousePosition.y;
      }
        
      let angle = Math.atan2(y, x) * 180 / Math.PI;
      
      let activeButton: number;
      for (let index = 0; index < this.buttons.length; index++) {
        if (Math.abs(this.buttonAngles[index] - angle) < 360 / this.buttons.length / 3 && canBuy) {
          this.buttons[index].setLocalScale(new Sup.Math.Vector3(1.2, 1.2, 1));
          activeButton = index;
        }
        else { this.buttons[index].setLocalScale(new Sup.Math.Vector3(1, 1, 1)); }
      }
        
      if (activeButton && (Sup.Input.wasMouseButtonJustReleased(0) || Sup.Input.wasGamepadButtonJustReleased(0, 7))) {
        let score = Game.scoreBehavior.value;
        if (score >= this.buttonPrices[activeButton]) {
          let name = this.buttonNames[activeButton];
          let playerBehavior = Game.playerActor.getBehavior(PlayerBehavior);
          
          let buyed = false;
          if (name === "Health" && playerBehavior.health < 3) {
            buyed = true;
            playerBehavior.heal();
          } 
          else if (name === "Boots" && playerBehavior.slowFactor > 0.5) {
            buyed = true;
            playerBehavior.slowFactor -= 0.08;
          } 
          else if (name === "Drill" && playerBehavior.digDuration > 10) {
            buyed = true;
            playerBehavior.digDuration -= 5;
          }
          else if (name === "Fist" && playerBehavior.chargeMultiplier < 1.3) {
            buyed = true;
            playerBehavior.chargeMultiplier += 0.05;
          }
              
          if (buyed) {
            Game.scoreBehavior.setValue(score - this.buttonPrices[activeButton]);
            Sup.Audio.playSound("Effects/Pick Up Gem", 0.3);
          }
        }
      }
          
    }
    else {
      this.scale.x = Sup.Math.lerp(this.scale.x, 0.001, 0.2);
      this.scale.y = Sup.Math.lerp(this.scale.y, 0.001, 0.2);
    }
      
    this.actor.setLocalScale(this.scale);
  }
      
  open() { this.opened = true; }
  close() { this.opened = false; }
}
Sup.registerBehavior(ShopBehavior);

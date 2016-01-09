class WaveManager extends Sup.Behavior {
  spawnInterval = 180;
  timer = 0;

  wave = 0;
  enemyStats: { [key:string]: { speed: number; width: number; height: number; fly: boolean; avoidWater: boolean; charge: number} } = {};  
  enemiesByWave: any[] = [];
  maxEnemiesByWave: number[] = [];

  mustSpawnBoss = false;

  changeWaveTimer: number;
  changeWaveDuration = 16 * 60;

  spawnpoints: Sup.Math.Vector3[] = [];
  shipDoorActor: Sup.Actor;
  
  awake() {
    // Setup enemy stats
    this.enemyStats["Small"] =          { "speed": 0.03, "width": 0.5, "height": 0.5, "fly": false, "avoidWater": false, "charge": 0 };
    this.enemyStats["Night Small"] =    { "speed": 0.05, "width": 0.5, "height": 0.5, "fly": false, "avoidWater": true,  "charge": 0 };
    this.enemyStats["White Yeti"] =     { "speed": 0.04, "width": 0.9, "height": 0.9, "fly": false, "avoidWater": true,  "charge": 0 };
    this.enemyStats["Yellow Yeti"] =    { "speed": 0.07, "width": 0.9, "height": 0.9, "fly": false, "avoidWater": true,  "charge": 0 };
    this.enemyStats["Fly"] =            { "speed": 0.05, "width": 0.9, "height": 0.9, "fly": true , "avoidWater": true,  "charge": 0 };
    this.enemyStats["Yellow Gorilla"] = { "speed": 0.04, "width": 0.9, "height": 0.9, "fly": false, "avoidWater": true,  "charge": 0.1 };
    
    // Setup wave enemies
    this.enemiesByWave[0] = [ "Small", 4 ];
    this.enemiesByWave[1] = [ "Small", 6, "White Yeti", 2 ];
    this.enemiesByWave[2] = [ "Small", 6, "White Yeti", 2, "Night Small", 2, "Fly", 2 ];
    this.enemiesByWave[3] = [ "Small", 4, "White Yeti", 2, "Night Small", 2, "Fly", 2, "Yellow Yeti", 2];
    this.enemiesByWave[4] = [ "Small", 4, "White Yeti", 4, "Night Small", 2, "Fly", 4, "Yellow Yeti", 2, "Yellow Gorilla", 2 ];
    this.enemiesByWave[5] = [ "Small", 4, "White Yeti", 4, "Night Small", 2, "Fly", 4, "Yellow Yeti", 2, "Yellow Gorilla", 2 ];
    this.enemiesByWave[6] = [ "Small", 4, "White Yeti", 4, "Night Small", 2, "Fly", 6, "Yellow Yeti", 2, "Yellow Gorilla", 2 ];
    
    this.maxEnemiesByWave[0] = 2;
    this.maxEnemiesByWave[1] = 3;
    this.maxEnemiesByWave[2] = 5;
    this.maxEnemiesByWave[3] = 7;
    this.maxEnemiesByWave[4] = 8;
    this.maxEnemiesByWave[5] = 8;
    this.maxEnemiesByWave[6] = 8;
  
    for (let y = 0; y < Game.map.getHeight(); y++) {
      for (let x = 0; x < Game.map.getWidth(); x++) {
        let tile = Game.map.getTileAt(0, x, y);
        if (tile === 13) this.spawnpoints.push(new Sup.Math.Vector3(x + 0.5, y + 0.5, 0));
      }
    }
    
    this.changeWaveTimer = this.changeWaveDuration;
    this.shipDoorActor = Sup.getActor("Door");
  }

  update() {
    if (Game.playerActor.getBehavior(PlayerBehavior).isDead) return;
      
    if (this.changeWaveTimer > 0) {
      this.changeWaveTimer -= 1;
      if (this.changeWaveTimer === this.changeWaveDuration / 4 && this.wave <= this.enemiesByWave.length) {
        Sup.Audio.playSound("Effects/Warning");
        let waveActor = new Sup.Actor("Float wave", Sup.getActor("HUD"));
        
        let waveDangerActor = new Sup.Actor("Float wave text", waveActor);
        waveDangerActor.setLocalPosition(new Sup.Math.Vector3(0, 3, 0));
        let waveDangerRndr = new Sup.SpriteRenderer(waveDangerActor, "HUD/Wave/Danger");
        waveDangerRndr.setAnimation("Animation");
        
        let waveTextActor = new Sup.Actor("Float wave text", waveActor);
        waveTextActor.setLocalScale(new Sup.Math.Vector3(0.8));
        waveTextActor.setLocalPosition(new Sup.Math.Vector3(0, -0.2, 0));
        
        if (this.wave == this.enemiesByWave.length) { new Sup.SpriteRenderer(waveTextActor, "HUD/Wave/Boss Incoming"); }
        else {
          new Sup.SpriteRenderer(waveTextActor, "HUD/Wave/Text");

          let waveNumberActor = new Sup.Actor("Float wave number", waveActor);
          waveNumberActor.setLocalScale(new Sup.Math.Vector3(0.5, 0.5, 0.5))
          waveNumberActor.setLocalPosition(new Sup.Math.Vector3(0.5, -2.5, 0))
          let numberBehavior = waveNumberActor.addBehavior(NumberBehavior);
          numberBehavior.value = this.wave + 1;
          numberBehavior.font = "HUD/Wave/Digits";
        }

        let floatUpBehavior = waveActor.addBehavior(FloatUpBehavior, { delay: 100, speed: 0 });
      }
      else if (this.changeWaveTimer == 0) {
        if (this.wave == this.enemiesByWave.length + 1) { return }
          
        this.changeWaveTimer = -1;
        this.timer = this.spawnInterval - 30;
        
        this.shipDoorActor.spriteRenderer.setAnimation("Close", false);
        Sup.Audio.playSound("Ship/Door Sound");
        Sup.getActor("Shop Arrow").setLocalScale(new Sup.Math.Vector3(0.001));
        Game.map.setTileAt(Game.collisionLayer, 10, 9, 0);
        Game.playerActor.getBehavior(PlayerBehavior).closeShip();
      }
      return
    }
    if (this.enemiesByWave[this.wave] && this.enemiesByWave[this.wave].length > 0) {
      if (Game.enemies.length < this.maxEnemiesByWave[this.wave]) {
        this.timer += 1;
        if (this.timer == this.spawnInterval) this.spawn(false);
      }
    }
    else if (this.mustSpawnBoss) {
      this.mustSpawnBoss = false;
      this.spawn(true);
    }
    else if (Game.enemies.length === 0) {
      this.wave += 1;
      
      if (this.wave == this.enemiesByWave.length + 1) {
        let winScreenActor = new Sup.Actor("Win", Sup.getActor("HUD"));
        winScreenActor.addBehavior(WinBehavior);
        this.changeWaveTimer = 0;
        return
      }
      else if (this.wave == this.enemiesByWave.length) this.mustSpawnBoss = true;
      this.changeWaveTimer = this.changeWaveDuration;
      
      this.shipDoorActor.spriteRenderer.setAnimation("Open", false);
      Sup.Audio.playSound("Ship/Door Sound");
      Sup.getActor("Shop Arrow").setLocalScale(new Sup.Math.Vector3(1));
      Game.map.setTileAt(Game.collisionLayer, 10, 9, -1);
    }
  }

  spawn(boss: boolean) {
    this.timer = 0;
    
    let distance = 0;
    let playerPosition = Game.playerActor.getLocalPosition();
    let spawnPosition: Sup.Math.Vector3;
    while (distance < 5) {
      spawnPosition = Sup.Math.Random.sample(this.spawnpoints);
      distance = playerPosition.distanceTo(spawnPosition);
    }

    let enemyActor = new Sup.Actor("Enemy");
    enemyActor.setLocalPosition(spawnPosition);

    if (boss) {
      enemyActor.addBehavior(BossBehavior);
      return;
    }
    
    let enemyType: string;
    let enemyIndex = (Sup.Math.Random.integer(1, this.enemiesByWave[this.wave].length / 2) - 1) * 2;
    enemyType = this.enemiesByWave[this.wave][enemyIndex];

    this.enemiesByWave[this.wave][enemyIndex+1] -= 1;
    if (this.enemiesByWave[this.wave][enemyIndex+1] === 0) this.enemiesByWave[this.wave].splice(enemyIndex,2);
      
    let enemyStat = this.enemyStats[enemyType];
    let behavior = enemyActor.addBehavior(EnemyBehavior);
    
    behavior.type = enemyType;
    behavior.speed = enemyStat.speed;
    behavior.width = enemyStat.width;
    behavior.height = enemyStat.height;
    behavior.fly = enemyStat.fly;
    behavior.avoidWater = enemyStat.avoidWater;
    behavior.charge = enemyStat.charge;
  }
}
Sup.registerBehavior(WaveManager);

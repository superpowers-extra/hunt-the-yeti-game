module Game {
  
  export let map: Sup.TileMap;
  export let playerActor: Sup.Actor;
  export let drillFXActor: Sup.Actor;
  
  export let enemies: Array<EnemyBehavior> = [];
  export let waterManager: WaterManager;
  export let shopBehavior: ShopBehavior;
  
  export let pickUps: Array<PickUpBehavior> = [];
  
  export let collisionLayer: number = 0;
  export let iceLayer: number = 1;
  export let waterLayer: number = 2;
  
  export let scoreBehavior: NumberBehavior;
  
  export let music: Sup.Audio.SoundPlayer;
  export let started: boolean = false;
  export let usingGamepad: boolean = false;
  export let firstGame: boolean = true;
  
  export let tutorialActors: Array<Sup.Actor> = [];
  export let activeTutorialIndex: number = 0;
  export let nextTutorialTimer: number = 0;
  export let nextTutorialDuration: number = 45;
  
  export let hasKilledEnemy: boolean = false;
  
  export function initialize() {
    Game.music = Sup.Audio.playSound("Music", 0.2, { loop: true });
    
    // Load scene
    Sup.loadScene("Scene");
    Game.playerActor = Sup.getActor("Player");
    
    // Setup map
    let mapActor = Sup.getActor("Map");
    let mapIndex = Sup.Math.Random.integer(1, 5);
    Game.map = Sup.get("Maps/" + mapIndex, Sup.TileMap);
    new Sup.TileMapRenderer(mapActor, Game.map);
    
    Game.shopBehavior = Sup.getActor("Shop").getBehavior(ShopBehavior);
    
    if (Game.firstGame) {
      Game.firstGame = false;
      Game.showTitleScren();
    }
    
    else {
      Sup.getActor("All Ship").addBehavior(ShipBehavior, { landed: true });
      
      if (Game.activeTutorialIndex < 5) Game.startTutorial();        
      Game.start();
    }
  }
  
  export function showTitleScren() {
    Game.playerActor.setLocalScale(new Sup.Math.Vector3(0.001, 0.001, 0.001));
    Sup.appendScene(Sup.get("Menus/Title Screen", Sup.Scene));
  }
  
  export function setUsingGamepad(usingGamepad: boolean) {
    Game.usingGamepad = usingGamepad;
    
    Sup.getActor("All Ship").addBehavior(ShipBehavior);
    Game.startTutorial();
  }
    
  export function startTutorial() {
    Game.activeTutorialIndex = 0;
  
    let pos = new Sup.Math.Vector3(10, 2, 10);
    Game.tutorialActors.push(Sup.appendScene(Sup.get("Tutorial/Move/Scene", Sup.Scene))[0]);
    Game.tutorialActors.push(Sup.appendScene(Sup.get("Tutorial/Digging/Scene", Sup.Scene))[0]);
    Game.tutorialActors.push(Sup.appendScene(Sup.get("Tutorial/Jumping/Scene", Sup.Scene))[0]);
    Game.tutorialActors.push(Sup.appendScene(Sup.get("Tutorial/Punching/Scene", Sup.Scene))[0]);
    Game.tutorialActors.push(Sup.appendScene(Sup.get("Tutorial/Enemies/Scene", Sup.Scene))[0]);
    
    let index = 0;
    while (index < Game.tutorialActors.length) {
      let tutorialActor = Game.tutorialActors[index];
      tutorialActor.setPosition(pos);
      tutorialActor.setLocalScale(new Sup.Math.Vector3(0.001,0.001,0.001));
      if (Game.usingGamepad) { tutorialActor.getChild("Keyboard").destroy(); }
      else { tutorialActor.getChild("Gamepad").destroy(); }  
      index += 1
    }
    Game.tutorialActors[0].setLocalScale(new Sup.Math.Vector3(1,1,1))
  }
  
  export function updateTutorial() {
    if (Game.tutorialActors.length < Game.activeTutorialIndex) { return }
      
    if (Game.nextTutorialTimer > 0) {
      Game.nextTutorialTimer += 1;
      if (Game.nextTutorialTimer == Game.nextTutorialDuration) {
        Game.nextTutorialTimer = 0;
        Game.nextTutorial();
      }
      return
    }
    
    let activeTutorialActor = Game.tutorialActors[Game.activeTutorialIndex];
    
    if (Game.activeTutorialIndex == 0) {
      if (! Game.usingGamepad) {
        if (Sup.Input.isKeyDown("Z") || Sup.Input.isKeyDown("W") || Sup.Input.isKeyDown("S") || Sup.Input.isKeyDown("Q") || Sup.Input.isKeyDown("A") || Sup.Input.isKeyDown("D")) {
          Game.nextTutorialTimer = 1;
        }
      }
      else {
        if (Sup.Input.getGamepadAxisValue(0, 0) != 0 || Sup.Input.getGamepadAxisValue(0, 1) != 0) { Game.nextTutorialTimer = 1; }
      }
    }
    else if (Game.activeTutorialIndex == 1) {
      if (Game.waterManager.waterTiles.length > 0) { Game.nextTutorialTimer = 1; }
    }
    else if (Game.activeTutorialIndex == 2) {
      if (! Game.usingGamepad) {
        if (Sup.Input.isKeyDown("SPACE")) { Game.nextTutorialTimer = 1; }
      }
      else
        if (Sup.Input.wasGamepadButtonJustPressed(0, 0)) { Game.nextTutorialTimer = 1; }
    }
    else if (Game.activeTutorialIndex == 3) {
      // Punching
      if (! Game.usingGamepad) {
        if (Sup.Input.wasMouseButtonJustReleased(2)) { Game.nextTutorialTimer = 1; }
      }
      else
        if (Sup.Input.wasGamepadButtonJustReleased(0, 6)) { Game.nextTutorialTimer = 1; }
    }
    else if (Game.activeTutorialIndex == 4) {
      // Enemies
      if (Game.hasKilledEnemy) { Game.nextTutorialTimer = 1; }
    }
  }
  
  export function nextTutorial() {
    let activeTutorialActor = Game.tutorialActors[Game.activeTutorialIndex];
    activeTutorialActor.destroy();
    
    Game.activeTutorialIndex += 1
    if (Game.activeTutorialIndex >= Game.tutorialActors.length) { return }
    
    activeTutorialActor = Game.tutorialActors[Game.activeTutorialIndex];
    activeTutorialActor.setLocalScale(new Sup.Math.Vector3(1,1,1));
  }
  
  export function start() {
    // Setup score
    let scoreActor = Sup.getActor("Score");
    Game.scoreBehavior = scoreActor.addBehavior(NumberBehavior);
    
    let mapActor = Sup.getActor("Map");
    mapActor.addBehavior(WaveManager);
    mapActor.addBehavior(BonusManager);
    Game.waterManager = mapActor.addBehavior(WaterManager);
    
    Game.started = true;
  }
    
  export function finish() {
    Game.music.stop();
    
    // Clear game
    Game.started = false;
    Game.enemies.length = 0;
    Game.pickUps.length = 0;
    Game.hasKilledEnemy = false;
    
    Game.tutorialActors.length = 0;
    
    Game.initialize();
  }
}

Game.initialize();

/* GameOneScene.js */

class GameOneScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOneScene' });
  }

  preload() {
    // Retrieve selected duck number (default to duck 1)
    let selectedDuck = this.registry.get('selectedDuck') || 1;
    let duckFolder = 'assets/ducks/duck' + selectedDuck + '/';

    // Load duck animation frames.
    this.load.image('idle1', duckFolder + 'Idle/Idle 001.png');
    this.load.image('idle2', duckFolder + 'Idle/Idle 002.png');
    this.load.image('walk1', duckFolder + 'Walking/Walking 001.png');
    this.load.image('walk2', duckFolder + 'Walking/Walking 002.png');
    this.load.image('run1', duckFolder + 'Running/Running 001.png');
    this.load.image('run2', duckFolder + 'Running/Running 002.png');
    this.load.image('jump1', duckFolder + 'Jumping/Jumping 001.png');
    this.load.image('crouch1', duckFolder + 'Crouching/Crouching 001.png');
    this.load.image('dead1', duckFolder + 'Dead/Dead 001.png');

    // Load other assets.
    // Arrow is now loaded as a spritesheet (frame dimensions adjusted as needed).
    this.load.spritesheet('arrow', 'assets/images/arrow.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('platform', 'assets/images/platform.png');
    // Gem is now a spritesheet.
    this.load.spritesheet('gem', 'assets/images/gem.png', { frameWidth: 47, frameHeight: 47 });
    this.load.image('finishLine', 'assets/images/finish_line.png');
    this.load.image('game1-bg', 'assets/images/backgrounds/game1.png');

    // Load audio assets.
    this.load.audio('gameMusic', 'assets/audio/game1.mp3');
    this.load.audio('quack', 'assets/audio/quack.ogg');
  }

  create() {
    // Add background and start game music.
    this.add.image(512, 384, 'game1-bg');
    this.sound.stopAll();
    this.music = this.sound.add('gameMusic', { loop: true });
    this.music.play();
    this.physics.world.gravity.y = 600;

    // Timer: store start time.
    if (!this.registry.has('startTime')) {
      this.registry.set('startTime', this.time.now);
    }
    this.startTime = this.registry.get('startTime');
    this.penaltyTime = 0;
    this.deathTimestamp = null;

    // Create duck animations.
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'idle1' }, { key: 'idle2' }],
      frameRate: 2,
      repeat: -1
    });
    this.anims.create({
      key: 'walk',
      frames: [{ key: 'walk1' }, { key: 'walk2' }],
      frameRate: 2,
      repeat: -1
    });
    this.anims.create({
      key: 'run',
      frames: [{ key: 'run1' }, { key: 'run2' }],
      frameRate: 2,
      repeat: -1
    });
    this.anims.create({
      key: 'jump',
      frames: [{ key: 'jump1' }],
      frameRate: 1,
      repeat: 0
    });
    this.anims.create({
      key: 'crouch',
      frames: [{ key: 'crouch1' }],
      frameRate: 1,
      repeat: 0
    });
    this.anims.create({
      key: 'dead',
      frames: [{ key: 'dead1' }],
      frameRate: 1,
      repeat: 0
    });

    // Create arrow animation from the spritesheet.
    this.anims.create({
      key: 'arrow_fly',
      frames: this.anims.generateFrameNumbers('arrow', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    // Create gem animation from the spritesheet.
    this.anims.create({
      key: 'gem_spin',
      frames: this.anims.generateFrameNumbers('gem', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    // Create platforms with no overlap, maximum horizontal spread,
    // and ensure the top platform remains visible.
    this.platforms = this.physics.add.staticGroup();
    const platformScale = 0.45;
    const numPlatforms = 15;
    const bottomY = 650;
    const topY = 150;
    const verticalGap = (bottomY - topY) / (numPlatforms - 1);
    const viewportWidth = this.sys.game.config.width;
    const maxHorizontalGap = 250; // Maximum allowed horizontal difference from previous platform

    // Get platform dimensions.
    const platformImage = this.textures.get('platform').getSourceImage();
    const platformWidth = platformImage.width * platformScale;
    const platformHeight = platformImage.height * platformScale;

    let platformPositions = [];
    // Starting platform.
    let startX = 150;
    platformPositions.push({ x: startX, y: bottomY });

    // Generate remaining platforms.
    for (let i = 1; i < numPlatforms; i++) {
      let candidateY = bottomY - i * verticalGap;
      let candidateX;
      let validCandidate = false;
      let attempts = 0;
      while (!validCandidate && attempts < 100) {
        attempts++;
        // For the top platform, force it into a central horizontal region.
        if (i === numPlatforms - 1) {
          candidateX = Phaser.Math.Between(
            Math.floor(viewportWidth * 0.3),
            Math.floor(viewportWidth * 0.7)
          );
        } else {
          candidateX = Phaser.Math.Between(50, viewportWidth - 50);
        }
        // Ensure horizontal gap from previous platform is within maxHorizontalGap.
        let prevX = platformPositions[i - 1].x;
        if (Math.abs(candidateX - prevX) > maxHorizontalGap) {
          continue;
        }
        // Check for overlap with all previously placed platforms.
        let candidateRect = new Phaser.Geom.Rectangle(
          candidateX - platformWidth / 2,
          candidateY - platformHeight / 2,
          platformWidth,
          platformHeight
        );
        validCandidate = true;
        for (let pos of platformPositions) {
          let existingRect = new Phaser.Geom.Rectangle(
            pos.x - platformWidth / 2,
            pos.y - platformHeight / 2,
            platformWidth,
            platformHeight
          );
          if (Phaser.Geom.Intersects.RectangleToRectangle(candidateRect, existingRect)) {
            validCandidate = false;
            break;
          }
        }
      }
      if (!validCandidate) {
        candidateX = platformPositions[i - 1].x;
      }
      platformPositions.push({ x: candidateX, y: candidateY });
    }

    // Create platform game objects.
    platformPositions.forEach(pos => {
      let plat = this.platforms.create(pos.x, pos.y, 'platform').setScale(platformScale);
      plat.refreshBody();
      // Only allow collision on the top side so the duck can pass through from below.
      plat.body.checkCollision.left = false;
      plat.body.checkCollision.right = false;
      plat.body.checkCollision.down = false;
    });
    // Define the starting platform as the first one.
    this.startingPlatform = this.platforms.getChildren()[0];

    // Create gems on each platform.
    // Use a dynamic group so each gem can be animated.
    this.gems = this.physics.add.group();
    this.platforms.getChildren().forEach(platform => {
      // Calculate gem's Y so it is centered on top of the platform.
      // Gem height is taken from its source image (47) multiplied by the scale (1).
      let gemY = platform.y - platform.displayHeight / 2 - (this.textures.get('gem').getSourceImage().height * 1) / 2;
      let gem = this.physics.add.sprite(platform.x, gemY, 'gem').setScale(1);
      gem.setOrigin(0.5);
      gem.body.allowGravity = false;
      gem.setImmovable(true);
      gem.anims.play('gem_spin');
      gem.body.updateFromGameObject();
      this.gems.add(gem);
    });

    // Create the duck sprite on the starting platform.
    const duckScale = 1;
    this.duck = this.physics.add.sprite(
      this.startingPlatform.x,
      this.startingPlatform.y - this.startingPlatform.displayHeight / 2,
      'idle1'
    )
      .setOrigin(0.5, 1)
      .setScale(duckScale)
      .setCollideWorldBounds(false);
    this.duck.anims.play('idle', true);
    this.duck.body.setSize(this.duck.displayWidth * 0.75, this.duck.displayHeight * 0.75);
    this.duck.body.setOffset(
      (this.duck.displayWidth - this.duck.body.width) / 2,
      this.duck.displayHeight - this.duck.body.height
    );

    // Record duck spawn time.
    this.duckSpawnTime = this.time.now;
    this.duckIsDead = false;

    // Set up keyboard controls.
    this.cursors = this.input.keyboard.createCursorKeys();

    // Jump Mechanic.
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.input.keyboard.on('keydown-UP', function () {
      if (this.duck.body.blocked.down && !this.isJumping) {
        this.isJumping = true;
        this.jumpStartTime = this.time.now;
        // Start immediately with a small jump (10% of screen height).
        let screenHeight = this.sys.game.config.height;
        let g = this.physics.world.gravity.y;
        let h_small = 0.10 * screenHeight;
        let v_small = Math.sqrt(2 * g * h_small);
        this.duck.setVelocityY(-v_small);
        this.duck.anims.play('jump', true);
        this.sound.play('quack');
      }
    }, this);
    this.input.keyboard.on('keyup-UP', function () {
      if (this.isJumping) {
        let pressDuration = this.time.now - this.jumpStartTime;
        pressDuration = Phaser.Math.Clamp(pressDuration, 0, 1500);
        let screenHeight = this.sys.game.config.height;
        let g = this.physics.world.gravity.y;
        let h_small = 0.10 * screenHeight;
        let h_super = 0.25 * screenHeight;
        let desiredHeight = pressDuration >= 1000 ? h_super : h_small;
        let v_desired = Math.sqrt(2 * g * desiredHeight);
        this.duck.setVelocityY(-v_desired);
        this.isJumping = false;
      }
    }, this);

    // ESC key to return to DuckSelectionScene.
    this.input.keyboard.on('keydown-ESC', () => {
      this.music.stop();
      this.scene.start('DuckSelectionScene');
    });

    // Create falling arrows.
    this.arrows = this.physics.add.group();
    this.time.addEvent({
      delay: 640,
      callback: () => {
        if (this.time.now - this.duckSpawnTime < 3000) return;
        let edge = Phaser.Math.Between(0, 2);
        let arrow;
        // Increased scale for better visibility.
        const arrowScale = 1.5;
        if (edge === 0) {
          arrow = this.arrows.create(
            Phaser.Math.Between(50, viewportWidth - 50),
            0,
            'arrow'
          ).setScale(arrowScale);
          arrow.setVelocityY(Phaser.Math.Between(200, 300));
        } else if (edge === 1) {
          arrow = this.arrows.create(
            0,
            Phaser.Math.Between(50, this.sys.game.config.height - 50),
            'arrow'
          ).setScale(arrowScale);
          arrow.setVelocityX(Phaser.Math.Between(200, 300));
          arrow.body.setGravityY(200);
        } else {
          arrow = this.arrows.create(
            viewportWidth,
            Phaser.Math.Between(50, this.sys.game.config.height - 50),
            'arrow'
          ).setScale(arrowScale);
          arrow.setVelocityX(-Phaser.Math.Between(200, 300));
          arrow.body.setGravityY(200);
        }
        if (arrow.body) {
          arrow.body.updateFromGameObject();
        }
        arrow.anims.play('arrow_fly');
      },
      loop: true
    });

    // Collisions.
    this.physics.add.collider(this.duck, this.platforms);
    this.physics.add.collider(this.gems, this.platforms);
    this.physics.add.overlap(this.duck, this.gems, (duck, gem) => { gem.destroy(); }, null, this);
    this.physics.add.overlap(this.duck, this.arrows, this.killDuck, null, this);

    // Timer text.
    this.timerText = this.add.text(16, 16, 'Time: 0.0s', {
      fontSize: '20px',
      fill: '#000',
      fontFamily: "'Comic Neue', sans-serif"
    });
  }

  update() {
    // Update timer.
    let currentTime = this.duckIsDead && this.deathTimestamp ? this.deathTimestamp : this.time.now;
    let elapsed = (currentTime - this.startTime + this.penaltyTime) / 1000;
    this.timerText.setText('Time: ' + elapsed.toFixed(1) + 's');
    if (this.duckIsDead) return;

    // Spawn finish line when all gems are collected.
    if (this.gems.countActive(true) === 0 && !this.finishLineCreated) {
      let currentPlatform = null;
      let minDist = Infinity;
      this.platforms.getChildren().forEach(plat => {
        let d = Phaser.Math.Distance.Between(plat.x, plat.y, this.duck.x, this.duck.y);
        if (d < minDist) {
          minDist = d;
          currentPlatform = plat;
        }
      });
      let candidatePlatforms = this.platforms.getChildren().filter(p => p !== currentPlatform);
      if (candidatePlatforms.length === 0) candidatePlatforms = this.platforms.getChildren();
      let chosenPlatform = Phaser.Utils.Array.GetRandom(candidatePlatforms);
      this.finishLine = this.physics.add.staticImage(
        chosenPlatform.x,
        chosenPlatform.y - chosenPlatform.displayHeight / 2,
        'finishLine'
      ).setScale(0.6);
      this.finishLine.refreshBody();
      this.finishLineCreated = true;
      this.physics.add.overlap(this.duck, this.finishLine, this.reachFinish, null, this);
    }

    // If duck falls off-screen, kill it.
    if (this.duck.y > this.sys.game.config.height) {
      this.killDuck();
    }

    // Horizontal movement.
    if (this.cursors.left.isDown) {
      this.duck.setVelocityX(-200);
      if (this.duck.body.blocked.down) {
        this.duck.anims.play('run', true);
      }
      this.duck.flipX = true;
    } else if (this.cursors.right.isDown) {
      this.duck.setVelocityX(200);
      if (this.duck.body.blocked.down) {
        this.duck.anims.play('run', true);
      }
      this.duck.flipX = false;
    } else {
      this.duck.setVelocityX(0);
      if (this.duck.body.blocked.down) {
        this.duck.anims.play('idle', true);
      }
    }
  }

  killDuck() {
    if (!this.duck.active || this.duckIsDead) return;
    this.duckIsDead = true;
    this.deathTimestamp = this.time.now;
    this.duck.setVelocity(0);
    this.duck.anims.play('dead', true);
    let deathText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'You just got quacked! Try Again.',
      {
        fontSize: '32px',
        fill: '#f00',
        fontFamily: "'Comic Neue', sans-serif",
        align: 'center'
      }
    ).setOrigin(0.5);
    this.arrows.clear(true, true);
    this.time.delayedCall(3000, () => {
      let pauseDuration = this.time.now - this.deathTimestamp;
      this.startTime += pauseDuration;
      deathText.destroy();
      this.duck.x = this.startingPlatform.x;
      this.duck.y = this.startingPlatform.y - this.startingPlatform.displayHeight / 2;
      this.duck.setVelocity(0);
      this.duck.anims.play('idle', true);
      this.duckIsDead = false;
      this.deathTimestamp = null;
      this.duckSpawnTime = this.time.now;
    });
  }

  reachFinish() {
    this.music.stop();
    let finalTime = (this.time.now - this.startTime + this.penaltyTime) / 1000;
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Finished!\nTime: ' + finalTime.toFixed(1) + 's',
      {
        fontSize: '32px',
        fill: '#0f0',
        fontFamily: "'Comic Neue', sans-serif",
        align: 'center'
      }
    ).setOrigin(0.5);
    this.registry.remove('startTime');
    this.time.delayedCall(1500, () => {
      this.scene.start('DuckSelectionScene');
    });
  }
}

window.GameOneScene = GameOneScene;

class GameOneScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOneScene' });
  }

  preload() {
    let selectedDuck = this.registry.get('selectedDuck') || 1;
    let duckFolder = 'assets/ducks/duck' + selectedDuck + '/';

    // Removed spaces from file names (e.g., "Idle 001.png" becomes "Idle001.png")
    this.load.image('idle1', duckFolder + 'Idle/Idle001.png');
    this.load.image('idle2', duckFolder + 'Idle/Idle002.png');
    this.load.image('walk1', duckFolder + 'Walking/Walking001.png');
    this.load.image('walk2', duckFolder + 'Walking/Walking002.png');
    this.load.image('run1', duckFolder + 'Running/Running001.png');
    this.load.image('run2', duckFolder + 'Running/Running002.png');
    this.load.image('jump1', duckFolder + 'Jumping/Jumping001.png');
    this.load.image('crouch1', duckFolder + 'Crouching/Crouching001.png');
    this.load.image('dead1', duckFolder + 'Dead/Dead001.png');

    this.load.spritesheet('arrow', 'assets/images/arrow.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('platform', 'assets/images/platform.png');
    this.load.spritesheet('gem', 'assets/images/gem.png', { frameWidth: 47, frameHeight: 47 });
    this.load.image('finishLine', 'assets/images/finish_line.png');
    this.load.image('game1-bg', 'assets/images/backgrounds/game1.png');
    this.load.image('balloon', 'assets/images/balloon.png');

    this.load.audio('gameMusic', 'assets/audio/game1.mp3');
    this.load.audio('quack', 'assets/audio/quack.ogg');
    this.load.audio('winner', 'assets/audio/winneris.ogg');
  }

  create() {
    this.add.image(512, 384, 'game1-bg');
    this.sound.stopAll();
    this.music = this.sound.add('gameMusic', { loop: true });
    // Defer music playback until after the first user interaction (pointerup)
    this.input.once('pointerup', () => {
      this.music.play();
    });
    this.physics.world.gravity.y = 600;

    if (!this.registry.has('startTime')) {
      this.registry.set('startTime', this.time.now);
    }

    this.startTime = this.registry.get('startTime');
    this.penaltyTime = 0;
    this.deathTimestamp = null;

    // Platform setup
    const scale = 0.05;
    const num = 15;
    const bottomY = 650;
    const topY = 150;
    const gapY = (bottomY - topY) / (num - 1);
    const w = this.sys.game.config.width;
    const platformWidth = 2048 * scale;
    const platformHeight = 1024 * scale;
    this.platforms = this.physics.add.staticGroup();

    let positions = [{ x: 150, y: bottomY }];
    for (let i = 1; i < num; i++) {
      let y = bottomY - i * gapY;
      let x = Phaser.Math.Between(50, w - 50);
      let prev = positions[i - 1];
      let attempts = 0;
      while ((Math.abs(x - prev.x) > 250 || this._overlapPlatform(x, y, positions, platformWidth, platformHeight)) && attempts++ < 100) {
        x = Phaser.Math.Between(50, w - 50);
      }
      positions.push({ x, y });
    }

    positions.forEach(pos => {
      let plat = this.platforms.create(pos.x, pos.y, 'platform').setScale(scale);
      plat.refreshBody();
      plat.body.checkCollision.left = false;
      plat.body.checkCollision.right = false;
      plat.body.checkCollision.down = false;
    });

    this.startingPlatform = this.platforms.getChildren()[0];

    // Gems
    this.gems = this.physics.add.group();
    this.platforms.getChildren().forEach(p => {
      let y = p.y - p.displayHeight / 2 - 24;
      let gem = this.physics.add.sprite(p.x, y, 'gem').setScale(1);
      gem.body.allowGravity = false;
      gem.setImmovable(true);
      gem.anims.play('gem_spin');
      this.gems.add(gem);
    });

    // Duck
    this.duck = this.physics.add.sprite(
      this.startingPlatform.x,
      this.startingPlatform.y - this.startingPlatform.displayHeight / 2,
      'idle1'
    )
      .setOrigin(0.5, 1)
      .setScale(1);
    this.duck.anims.play('idle', true);
    this.duck.body.setSize(this.duck.displayWidth * 0.75, this.duck.displayHeight * 0.75);
    this.duck.body.setOffset((this.duck.displayWidth - this.duck.body.width) / 2, this.duck.displayHeight - this.duck.body.height);
    this.duckSpawnTime = this.time.now;
    this.duckIsDead = false;

    // Animations
    this.anims.create({ key: 'idle', frames: [{ key: 'idle1' }, { key: 'idle2' }], frameRate: 2, repeat: -1 });
    this.anims.create({ key: 'walk', frames: [{ key: 'walk1' }, { key: 'walk2' }], frameRate: 2, repeat: -1 });
    this.anims.create({ key: 'run', frames: [{ key: 'run1' }, { key: 'run2' }], frameRate: 2, repeat: -1 });
    this.anims.create({ key: 'jump', frames: [{ key: 'jump1' }], frameRate: 1 });
    this.anims.create({ key: 'crouch', frames: [{ key: 'crouch1' }], frameRate: 1 });
    this.anims.create({ key: 'dead', frames: [{ key: 'dead1' }], frameRate: 1 });
    this.anims.create({ key: 'arrow_fly', frames: this.anims.generateFrameNumbers('arrow', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'gem_spin', frames: this.anims.generateFrameNumbers('gem', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.isJumping = false;
    this.jumpStartTime = 0;
    this.input.keyboard.on('keydown-UP', () => this.touchControls.jumpPressed = true);
    this.input.keyboard.on('keyup-UP', () => this.touchControls.jumpReleased = true);
    this.input.keyboard.on('keydown-ESC', () => {
      this.music.stop();
      this.scene.start('DuckSelectionScene');
    });

    // Touch controls
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.touchControls = { left: false, right: false, jumpPressed: false, jumpReleased: false, downHeld: false };
    this.downHoldStart = 0;

    if (this.isTouchDevice) {
      const pad = 24, size = 80, h = this.sys.game.config.height, w = this.sys.game.config.width;
      this._makeButton('←', pad, h - size - pad, 'left');
      this._makeButton('→', pad + size + 10, h - size - pad, 'right');
      this._makeButton('↑', w - size - pad, h - size - pad, 'jumpPressed', 'jumpReleased');
      this._makeButton('↓', w - size - pad, h - size * 2 - pad - 10, 'downHeld');
    }

    // Arrows
    this.arrows = this.physics.add.group();
    this.time.addEvent({
      delay: 640,
      callback: () => {
        if (this.time.now - this.duckSpawnTime < 3000) return;
        let edge = Phaser.Math.Between(0, 2);
        const scale = 1.5;
        let a;

        if (edge === 0) {
          a = this.arrows.create(Phaser.Math.Between(50, w - 50), 0, 'arrow').setScale(scale);
          a.setVelocityY(Phaser.Math.Between(200, 300));
        } else {
          let y = Phaser.Math.Between(50, this.sys.game.config.height - 50);
          let x = edge === 1 ? 0 : w;
          a = this.arrows.create(x, y, 'arrow').setScale(scale);
          a.setVelocityX(edge === 1 ? 300 : -300);
          a.body.setGravityY(200);
        }

        a.anims.play('arrow_fly');
      },
      loop: true
    });

    this.physics.add.collider(this.duck, this.platforms);
    this.physics.add.collider(this.gems, this.platforms);
    this.physics.add.overlap(this.duck, this.gems, (d, g) => g.destroy(), null, this);
    this.physics.add.overlap(this.duck, this.arrows, this.killDuck, null, this);

    this.timerText = this.add.text(16, 16, 'Time: 0.0s', {
      fontSize: '20px', fill: '#000', fontFamily: "'Comic Neue', sans-serif"
    });
  }

  update() {
    let currentTime = this.duckIsDead && this.deathTimestamp ? this.deathTimestamp : this.time.now;
    let elapsed = (currentTime - this.startTime + this.penaltyTime) / 1000;
    this.timerText.setText('Time: ' + elapsed.toFixed(1) + 's');
    if (this.duckIsDead) return;

    let left = this.cursors.left.isDown || this.touchControls.left;
    let right = this.cursors.right.isDown || this.touchControls.right;

    if (left) {
      this.duck.setVelocityX(-200);
      if (this.duck.body.blocked.down) this.duck.anims.play('run', true);
      this.duck.flipX = true;
    } else if (right) {
      this.duck.setVelocityX(200);
      if (this.duck.body.blocked.down) this.duck.anims.play('run', true);
      this.duck.flipX = false;
    } else {
      this.duck.setVelocityX(0);
      if (this.duck.body.blocked.down) this.duck.anims.play('idle', true);
    }

    // Jump
    if (this.touchControls.jumpPressed) {
      if (this.duck.body.blocked.down && !this.isJumping) {
        this.isJumping = true;
        this.jumpStartTime = this.time.now;
        this.duck.setVelocityY(-Math.sqrt(2 * 600 * this.sys.game.config.height * 0.1));
        this.duck.anims.play('jump', true);
        this.sound.play('quack');
      }
      this.touchControls.jumpPressed = false;
    }

    if (this.touchControls.jumpReleased) {
      if (this.isJumping) {
        let dt = Phaser.Math.Clamp(this.time.now - this.jumpStartTime, 0, 1500);
        let h = dt >= 1000 ? 0.25 : 0.1;
        this.duck.setVelocityY(-Math.sqrt(2 * 600 * this.sys.game.config.height * h));
        this.isJumping = false;
      }
      this.touchControls.jumpReleased = false;
    }

    // Drop-through
    let down = this.cursors.down.isDown || this.touchControls.downHeld;
    if (down && this.duck.body.blocked.down && !this.duck.dropCooldown) {
      if (!this.downHoldStart) this.downHoldStart = this.time.now;
      if (this.time.now - this.downHoldStart >= 1000) {
        this.duck.y += 10;
        this.duck.body.checkCollision.up = false;
        this.duck.dropCooldown = true;
        this.time.delayedCall(500, () => {
          this.duck.body.checkCollision.up = true;
          this.duck.dropCooldown = false;
        });
      }
    } else {
      this.downHoldStart = 0;
    }

    if (this.gems.countActive(true) === 0 && !this.finishLineCreated) {
      const platforms = this.platforms.getChildren();
      const chosen = Phaser.Utils.Array.GetRandom(platforms);
      this.finishLine = this.physics.add.staticImage(chosen.x, chosen.y - chosen.displayHeight / 2, 'finishLine').setScale(0.6);
      this.finishLine.refreshBody();
      this.finishLineCreated = true;
      this.physics.add.overlap(this.duck, this.finishLine, this.reachFinish, null, this);
    }

    if (this.duck.y > this.sys.game.config.height) {
      this.killDuck();
    }
  }

  killDuck() {
    if (!this.duck.active || this.duckIsDead) return;
    this.duckIsDead = true;
    this.deathTimestamp = this.time.now;
    this.duck.setVelocity(0);
    this.duck.anims.play('dead', true);

    const text = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY,
      'You just got quacked!\nTry Again.',
      {
        fontSize: '32px',
        fill: '#f00',
        fontFamily: "'Comic Neue', sans-serif",
        align: 'center'
      }
    ).setOrigin(0.5);

    this.arrows.clear(true, true);

    this.time.delayedCall(3000, () => {
      const pauseDuration = this.time.now - this.deathTimestamp;
      this.startTime += pauseDuration;
      text.destroy();
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
    if (this.victoryTriggered) return;
    this.victoryTriggered = true;
    this.music.stop();
    this.sound.play('winner');

    const finalTime = (this.time.now - this.startTime + this.penaltyTime) / 1000;

    for (let i = 1; i <= 5; i++) {
      let x = (this.sys.game.config.width / 6) * i;
      let y = this.sys.game.config.height + Phaser.Math.Between(0, 100);
      const balloon = this.add.image(x, y, 'balloon').setScale(0.5).setDepth(900);

      this.tweens.add({
        targets: balloon,
        y: y - 600,
        duration: Phaser.Math.Between(2000, 4000),
        ease: 'Sine.easeOut',
        delay: Phaser.Math.Between(0, 400),
        onComplete: () => balloon.destroy()
      });
    }

    const winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY,
      '🎉 YOU WIN! 🎉\nTime: ' + finalTime.toFixed(1) + 's',
      {
        fontSize: '64px',
        fill: '#ff0',
        stroke: '#000',
        strokeThickness: 8,
        fontFamily: "'Comic Neue', sans-serif",
        align: 'center'
      }).setOrigin(0.5).setDepth(1000);

    this.tweens.add({
      targets: winText,
      scale: { from: 1, to: 1.1 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });

    this.registry.remove('startTime');

    this.time.delayedCall(3000, () => {
      this.scene.start('DuckSelectionScene');
    });
  }

  _makeButton(label, x, y, downProp, upProp = null) {
    const btn = this.add.text(x, y, label, {
      fontSize: '48px',
      backgroundColor: '#000',
      padding: { x: 20, y: 10 },
      fill: '#fff'
    }).setInteractive().setScrollFactor(0).setDepth(1000);

    btn.on('pointerdown', () => this.touchControls[downProp] = true);
    btn.on('pointerup', () => {
      this.touchControls[downProp] = false;
      if (upProp) this.touchControls[upProp] = true;
    });
    btn.on('pointerout', () => {
      this.touchControls[downProp] = false;
    });
  }

  _overlapPlatform(x, y, positions, width, height) {
    const rect = new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height);
    return positions.some(pos => {
      const other = new Phaser.Geom.Rectangle(pos.x - width / 2, pos.y - height / 2, width, height);
      return Phaser.Geom.Intersects.RectangleToRectangle(rect, other);
    });
  }
}

window.GameOneScene = GameOneScene;

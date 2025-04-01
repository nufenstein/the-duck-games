class DuckSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DuckSelectionScene' });
  }

  preload() {
    for (let i = 1; i <= 10; i++) {
      this.load.image('duck' + i + 'Idle1', 'assets/ducks/duck' + i + '/Idle/Idle 001.png');
      this.load.image('duck' + i + 'Idle2', 'assets/ducks/duck' + i + '/Idle/Idle 002.png');
    }
    this.load.image('selection-bg', 'assets/images/backgrounds/selection_bg.png');
  }

  create() {
    if (!this.registry.has('menuMusic')) {
      this.music = this.sound.add('menuMusic', { loop: true });
      this.music.play();
      this.registry.set('menuMusic', this.music);
    } else {
      this.music = this.registry.get('menuMusic');
    }

    this.add.image(512, 384, 'selection-bg');

    this.add.text(512, 50, 'Select Your Duck', {
      fontSize: '32px',
      fill: '#000',
      fontFamily: "'Comic Neue', sans-serif"
    }).setOrigin(0.5, 0);

    for (let i = 1; i <= 10; i++) {
      this.anims.create({
        key: 'duck' + i + 'IdleAnim',
        frames: [
          { key: 'duck' + i + 'Idle1' },
          { key: 'duck' + i + 'Idle2' }
        ],
        frameRate: 2,
        repeat: -1
      });
    }

    const sillyNames = [
      "Quacky McDuckface", "Sir Quacksalot", "Ducky Doodle", "Feather Flinger", "Wing Commander",
      "Bill the Thrill", "Quack Norris", "Duck Vader", "The Quackster", "Puddle Jumper"
    ];

    let columns = 5, rows = 2, spacingX = 150, spacingY = 150;
    let gameWidth = this.sys.game.config.width;
    let gameHeight = this.sys.game.config.height;
    let startX = gameWidth / 2 - ((columns - 1) * spacingX) / 2;
    let totalGridHeight = (rows - 1) * spacingY;
    let startY = gameHeight / 2 - totalGridHeight / 2;

    let duckId = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const currentDuckId = duckId;

        let duckSprite = this.add
          .sprite(startX + c * spacingX, startY + r * spacingY, 'duck' + currentDuckId + 'Idle1')
          .setInteractive({ useHandCursor: true });

        duckSprite.setData('duckId', currentDuckId);
        duckSprite.anims.play('duck' + currentDuckId + 'IdleAnim');

        // Visual feedback on touch
        duckSprite.on('pointerdown', () => {
          duckSprite.setScale(0.95); // Slight shrink effect
        });

        duckSprite.on('pointerup', () => {
          duckSprite.setScale(1);
          this.registry.set('selectedDuck', currentDuckId);
          this.scene.start('GameOneScene');
        });

        duckSprite.on('pointerout', () => {
          duckSprite.setScale(1);
        });

        this.add.text(
          duckSprite.x,
          duckSprite.y + duckSprite.displayHeight / 2 + 10,
          sillyNames[currentDuckId - 1],
          { fontSize: '16px', fill: '#000', fontFamily: "'Comic Neue', sans-serif" }
        ).setOrigin(0.5, 0);

        duckId++;
      }
    }

    // Prevent pinch zoom / double-tap zoom
    this.sys.canvas.style.touchAction = 'manipulation';
  }
}

window.DuckSelectionScene = DuckSelectionScene;

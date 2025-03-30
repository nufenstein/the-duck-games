class DuckSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DuckSelectionScene' });
  }

  preload() {
    // Load idle animation frames for each duck (2 frames per duck)
    for (let i = 1; i <= 10; i++) {
      this.load.image('duck' + i + 'Idle1', 'assets/ducks/duck' + i + '/Idle/Idle 001.png');
      this.load.image('duck' + i + 'Idle2', 'assets/ducks/duck' + i + '/Idle/Idle 002.png');
    }
    // Load background image.
    this.load.image('selection-bg', 'assets/images/backgrounds/selection_bg.png');
    // Note: We do not load menuMusic here since it is already loaded in the StartScreenScene.
  }

  create() {
    // Do not stop the music; retrieve it from the registry.
    if (!this.registry.has('menuMusic')) {
      this.music = this.sound.add('menuMusic', { loop: true });
      this.music.play();
      this.registry.set('menuMusic', this.music);
    } else {
      this.music = this.registry.get('menuMusic');
    }

    // Add the background image.
    this.add.image(512, 384, 'selection-bg');

    // Center the header text.
    this.add.text(512, 50, 'Select Your Duck', {
      fontSize: '32px',
      fill: '#000',
      fontFamily: "'Comic Neue', sans-serif"
    }).setOrigin(0.5, 0);

    // Create idle animations for each duck.
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

    // Array of silly names for the ducks.
    const sillyNames = [
      "Quacky McDuckface",
      "Sir Quacksalot",
      "Ducky Doodle",
      "Feather Flinger",
      "Wing Commander",
      "Bill the Thrill",
      "Quack Norris",
      "Duck Vader",
      "The Quackster",
      "Puddle Jumper"
    ];

    // Set up a 2-row, 5-column grid for the duck selection.
    let columns = 5,
      rows = 2,
      spacingX = 150,
      spacingY = 150;
    let gameWidth = this.sys.game.config.width;
    let gameHeight = this.sys.game.config.height;
    // Calculate startX so that the grid is centered horizontally.
    let startX = gameWidth / 2 - ((columns - 1) * spacingX) / 2;
    // Center the grid vertically.
    let totalGridHeight = (rows - 1) * spacingY;
    let startY = gameHeight / 2 - totalGridHeight / 2;

    let duckId = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const currentDuckId = duckId;
        let duckSprite = this.add
          .sprite(startX + c * spacingX, startY + r * spacingY, 'duck' + currentDuckId + 'Idle1')
          .setInteractive();
        duckSprite.setData('duckId', currentDuckId);
        duckSprite.anims.play('duck' + currentDuckId + 'IdleAnim');
        duckSprite.on('pointerdown', () => {
          this.registry.set('selectedDuck', currentDuckId);
          // Do not stop the music so it continues to play.
          this.scene.start('GameOneScene');
        });
        // Add silly name text underneath each duck.
        this.add.text(
          duckSprite.x,
          duckSprite.y + duckSprite.displayHeight / 2 + 10, // Adjust vertical offset as needed
          sillyNames[currentDuckId - 1],
          { fontSize: '16px', fill: '#000', fontFamily: "'Comic Neue', sans-serif" }
        ).setOrigin(0.5, 0);
        duckId++;
      }
    }
  }
}

window.DuckSelectionScene = DuckSelectionScene;

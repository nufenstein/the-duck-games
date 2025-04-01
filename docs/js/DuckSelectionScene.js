class DuckSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DuckSelectionScene' });
  }

  preload() {
    for (let i = 1; i <= 10; i++) {
      // Removed spaces in file names: "Idle 001.png" becomes "Idle001.png"
      this.load.image('duck' + i + 'Idle1', 'assets/ducks/duck' + i + '/Idle/Idle001.png');
      this.load.image('duck' + i + 'Idle2', 'assets/ducks/duck' + i + '/Idle/Idle002.png');
    }
    this.load.image('selection-bg', 'assets/images/backgrounds/selection_bg.png');
  }

  create() {
    if (!this.registry.has('menuMusic')) {
      this.music = this.sound.add('menuMusic', { loop: true });
      // Defer audio playback until after the first user interaction (pointerup event)
      this.input.once('pointerup', () => {
        this.music.play();
      });
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
    let startX = gameWidth / 2 - ((columns - 1

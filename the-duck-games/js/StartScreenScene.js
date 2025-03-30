class StartScreenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScreenScene' });
  }

  preload() {
    // Load background image and menu music.
    this.load.image('start-bg', 'assets/images/backgrounds/selection_bg.png');
    this.load.audio('menuMusic', 'assets/audio/menu.ogg');
  }

  create() {
    // Add background.
    this.add.image(512, 384, 'start-bg');

    // Create a big interactive button that says "Let the Games Begin".
    let button = this.add.text(512, 384, 'Let the Games Begin', {
      fontSize: '48px',
      fill: '#fff',
      fontFamily: "'Comic Neue', sans-serif",
      backgroundColor: '#000',
      padding: { x: 20, y: 20 }
    }).setOrigin(0.5).setInteractive();

    // Play the menu music if it's not already playing.
    if (!this.registry.has('menuMusic')) {
      this.music = this.sound.add('menuMusic', { loop: true });
      this.music.play();
      this.registry.set('menuMusic', this.music);
    } else {
      this.music = this.registry.get('menuMusic');
    }

    // On button click, move to the duck selection scene.
    button.on('pointerdown', () => {
      // Do not stop the music; just switch scenes.
      this.scene.start('DuckSelectionScene');
    });
  }
}

window.StartScreenScene = StartScreenScene;

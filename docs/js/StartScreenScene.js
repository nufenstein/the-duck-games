class StartScreenScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScreenScene' });
  }

  preload() {
    this.load.image('start-bg', 'assets/images/backgrounds/selection_bg.png');
    this.load.audio('menuMusic', 'assets/audio/menu.ogg');
  }

  create() {
    // Add background
    this.add.image(512, 384, 'start-bg');

    // Create interactive button
    let button = this.add.text(512, 384, 'Let the Games Begin', {
      fontSize: '48px',
      fill: '#fff',
      fontFamily: "'Comic Neue', sans-serif",
      backgroundColor: '#000',
      padding: { x: 40, y: 30 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Visual feedback on pointer events
    button.on('pointerover', () => button.setStyle({ backgroundColor: '#222' }));
    button.on('pointerout', () => button.setStyle({ backgroundColor: '#000' }));
    button.on('pointerdown', () => {
      button.setScale(0.95);
    });

    // Handler for release events (both pointerup and pointerupoutside)
    const releaseHandler = () => {
      button.setScale(1);
      console.log("Button released – transitioning to DuckSelectionScene");
      
      // Start music if not already started
      if (!this.registry.has('menuMusic')) {
        this.music = this.sound.add('menuMusic', { loop: true });
        this.music.play();
        this.registry.set('menuMusic', this.music);
      }
      
      // Add a slight delay before starting the next scene
      this.time.delayedCall(50, () => {
        this.scene.start('DuckSelectionScene');
      });
    };

    button.on('pointerup', releaseHandler);
    button.on('pointerupoutside', releaseHandler);

    // Optional: Set canvas touch behavior to avoid iOS zooming
    this.sys.canvas.style.touchAction = 'manipulation';
  }
}

window.StartScreenScene = StartScreenScene;

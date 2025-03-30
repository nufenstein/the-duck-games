// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  // Order of scenes: start screen, duck selection screen, then game.
  scene: [StartScreenScene, DuckSelectionScene, GameOneScene]
};

// Initialize the game
const game = new Phaser.Game(config);

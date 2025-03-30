export default class ResultScene extends Phaser.Scene {
    constructor() { super({ key: 'ResultScene' }); }
    create() {
        const score = this.registry.get('score');
        this.add.text(300, 200, `Your Score: ${score}`, { fontSize: '32px', fill: '#000' });
        let medal = score > 200 ? 'Gold' : score > 100 ? 'Silver' : 'Bronze';
        this.add.text(300, 300, `Medal: ${medal}`, { fontSize: '40px', fill: '#FFD700' });
        this.add.text(250, 400, 'Refresh to play again!', { fontSize: '24px', fill: '#000' });
    }
}

import Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'

import ShooterGame from './scenes/game'
import EnterGame from './scenes/enter'
// TODO GameOver 

const config = {
	type: Phaser.AUTO,
	width: 1000,
	height: 800,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false,
			gravity: { y: 0 }
		}
	},
	scene: [ShooterGame],	// TODO Enter, Gameover
	parent: 'phaser-container',
	dom: {
		createContainer: true
	},
	plugins: {
		scene: [
			{
				key: 'rexUI',
				plugin: RexUIPlugin,
				mapping: 'rexUI'
			}
		]
	}
};

const game = new Phaser.Game(config);

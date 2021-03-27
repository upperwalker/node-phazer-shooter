import Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import {Enter, Shooter} from './scenes'

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
	scene: [Enter, Shooter],	// Gameover
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

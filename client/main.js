import Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'

import Soldier from "./classes/Soldier";
import WeaponFactory from "./classes/WeaponFactory";
import HealthBar from "./classes/HealthBar";
import socket from "./socket";

class StaticGroup extends Phaser.Physics.Arcade.StaticGroup	{	// TODO for large group of static objects
	constructor(scene, children) {
		super(scene.physics.world, scene);
	}
}
// TODO обоймы,  увеличение разроса,  вариация урона в зависимости от пули
class ShooterGame extends Phaser.Scene
{
	constructor() {
		super();

		this.soldier;
        this.pointer;
		this.inputKeys;
		this.gunsList;
		this.enemies = {};
	}

	preload() {
		this.load.image('bullet', '/assets/sprites/bullet.png');
		this.load.image('box', '/assets/sprites/box.png');
		this.load.image('blood', '/assets/sprites/blood.png');
		this.load.image('handgun', '/assets/sprites/handgun.png');
		this.load.image('smg', '/assets/sprites/smg.png');
		this.load.image('rifle', '/assets/sprites/rifle.png');
		this.load.image('shotgun', '/assets/sprites/shotgun.png');
		this.load.image('minigun', '/assets/sprites/minigun.png');
		this.load.audio('handgun', '/assets/sounds/handgun.wav')
        this.load.audio('smg', '/assets/sounds/smg.wav')
		this.load.audio('shotgun', '/assets/sounds/shotgun.wav')
		this.load.audio('rifle', '/assets/sounds/rifle.wav')
		this.load.audio('minigun', '/assets/sounds/minigun.wav')
		this.load.audio('reload', '/assets/sounds/reload.wav')
		this.load.audio('empty', '/assets/sounds/empty.wav')
        this.load.spritesheet('soldier', '/assets/sprites/soldier.png', {
            frameWidth: 49,
            frameHeight: 28,
        });
		this.load.image('loginperson', '/assets/sprites/loginperson.png');
		this.load.image('loginkey', '/assets/sprites/loginkey.png');
		this.load.image('soldier_dead', '/assets/sprites/soldierdead.png');

  		this.load.script('WeaponPlugin', './plugins/WeaponPlugin.min.js');
		    
		// this.load.scenePlugin({
		// 	key: 'rexUI',
		// 	plugin: RexUIPlugin,
		// 	mapping: 'rexUI'
        // });        
	}

	create() {
		// Install the weapon pluginClient
		const text = this.add.text(700, 20, 'War never changes...', { fixedWidth: 185, fixedHeight: 36 })
		text.setOrigin(0.5, 0.5)
		var print = this.add.text(0, 0, '');
		const COLOR_PRIMARY = 0x4e342e;
		const COLOR_LIGHT = 0x7b5e57;
		const COLOR_DARK = 0x260e04;
		
		const GetValue = Phaser.Utils.Objects.GetValue;
		var CreateLoginDialog = function (scene, config, onSubmit) {
			var username = GetValue(config, 'username', '');
			var password = GetValue(config, 'password', '');
			var title = GetValue(config, 'title', 'Welcome');
			var x = GetValue(config, 'x', 0);
			var y = GetValue(config, 'y', 0);
			var width = GetValue(config, 'width', undefined);
			var height = GetValue(config, 'height', undefined);
		
			var background = scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, COLOR_PRIMARY);
			var titleField = scene.add.text(0, 0, title);
			var userNameField = scene.rexUI.add.label({
				orientation: 'x',
				background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10).setStrokeStyle(2, COLOR_LIGHT),
				icon: scene.add.image(0, 0, 'loginperson'),
				text: scene.rexUI.add.BBCodeText(0, 0, username, { fixedWidth: 150, fixedHeight: 36, valign: 'center' }),
				space: { top: 5, bottom: 5, left: 5, right: 5, icon: 10, }
			})
				.setInteractive()
				.on('pointerdown', function () {
					var config = {
						onTextChanged: function(textObject, text) {
							username = text;
							textObject.text = text;
						}
					}
					scene.rexUI.edit(userNameField.getElement('text'), config);
				});
		
			var passwordField = scene.rexUI.add.label({
				orientation: 'x',
				background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10).setStrokeStyle(2, COLOR_LIGHT),
				icon: scene.add.image(0, 0, 'loginkey'),
				text: scene.rexUI.add.BBCodeText(0, 0, markPassword(password), { fixedWidth: 150, fixedHeight: 36, valign: 'center' }),
				space: { top: 5, bottom: 5, left: 5, right: 5, icon: 10, }
			})
				.setInteractive()
				.on('pointerdown', function () {
					var config = {
						type: 'password',
						text: password,
						onTextChanged: function(textObject, text) {
							password = text;
							textObject.text = markPassword(password);
						}
					};
					scene.rexUI.edit(passwordField.getElement('text'), config);
				});
		
			var loginButton = scene.rexUI.add.label({
				orientation: 'x',
				background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, COLOR_LIGHT),
				text: scene.add.text(0, 0, 'Login'),
				space: { top: 8, bottom: 8, left: 8, right: 8 }
			})
				.setInteractive()
				.on('pointerdown', function () {
					loginDialog.emit('login', username, password);
				});
		
			var loginDialog = scene.rexUI.add.sizer({
				orientation: 'y',
				x: x,
				y: y,
				width: width,
				height: height,
			})
				.addBackground(background)
				.add(titleField, 0, 'center', { top: 10, bottom: 10, left: 10, right: 10 }, false)
				.add(userNameField, 0, 'left', { bottom: 10, left: 10, right: 10 }, true)
				.add(passwordField, 0, 'left', { bottom: 10, left: 10, right: 10 }, true)
				.add(loginButton, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
				.layout();
			return loginDialog;
		};
		var markPassword = function (password) {
			return new Array(password.length + 1).join('•');
		};
		
		var loginDialog = CreateLoginDialog(this, {
			 x: 400,
			 y: 300,
			 title: 'Welcome',
			 username: 'abc',
			 password: '123',
		 })
			 .on('login', function (username, password) {
				 print.text += `${username}:${password}\n`;
			 })
			 //.drawBounds(this.add.graphics(), 0xff0000);
			 .popUp(500);
	   
		 //this.add.text(0, 560, 'Click user name or password field to edit it\nClick Login button to show user name and password')
		 loginDialog.scaleDownDestroy(100);
		 loginDialog = undefined;
		this.plugins.installScenePlugin(
			'WeaponPlugin',
			WeaponPlugin.WeaponPlugin,
			'weapons',
			this
		); 
		// Add sounds to scene
		this.sounds = {	
			handgun: this.sound.add('handgun'),
			smg: this.sound.add('smg'),
			shotgun: this.sound.add('shotgun'),
			rifle: this.sound.add('rifle'),
			minigun: this.sound.add('minigun'),
			reload: this.sound.add('reload'),
			empty: this.sound.add('empty'),
		}
		this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#556B2F");
		this.input.setDefaultCursor('url(assets/CrosshairNormal.cur), pointer');

		//this.gunsList = ['handgun','smg', 'shotgun', 'rifle', 'minigun']
		const centerX = this.cameras.main.width / 2;
		const centerY = this.cameras.main.height / 2;;
		this.obstacles = [ // obstacles
		  this.physics.add.sprite(centerX - 300, centerY - 300, 'box'),
		  this.physics.add.sprite(centerX - 300, centerY, 'box'),
		  this.physics.add.sprite(centerX - 300, centerY + 300, 'box'),
		  this.physics.add.sprite(centerX, centerY - 300, 'box'),
		  this.physics.add.sprite(centerX, centerY, 'box'),
		  this.physics.add.sprite(centerX, centerY + 300, 'box'),
		  this.physics.add.sprite(centerX + 300, centerY - 300, 'box'),
		  this.physics.add.sprite(centerX + 300, centerY, 'box'),
		  this.physics.add.sprite(centerX + 300, centerY + 300, 'box'),
		];
		this.pickedWeapons = [ // picked weapons
			//this.physics.add.sprite(32, 400, 'handgun'), default
			this.physics.add.sprite(centerX - 150, centerY - 150, 'smg'),
			this.physics.add.sprite(centerX + 150, centerY - 150, 'shotgun'),
			this.physics.add.sprite(centerX - 150, centerY + 150, 'rifle'),
			this.physics.add.sprite(centerX + 150, centerY + 150, 'minigun'),
		];
		this.obstacles.forEach(el => el.setPushable(false))
		this.soldier = new Soldier(this, 200, 2000, null, 100)
		this.soldier.ammunition = [WeaponFactory.create(this, this.soldier, 'handgun')];
		this.soldier.hb = new HealthBar(this, this.soldier, 100, 0, 0);
		this.wb = this.add.sprite(105, 9, 'handgun'),
		this.soldier.selectWeapon(this.soldier.ammunition[0])
		this.physics.add.overlap(this.soldier, this.pickedWeapons, this.soldier.pickUpWeapon);
		this.physics.add.collider(this.soldier, this.obstacles);
		this.addEvents();

		// socket messages handle
		socket.emit('addSoldier', this.soldier);

		socket.on('setPosition', (enemyKey, x, y) => {
			this.enemies[enemyKey].anims.play('walk', true)
			Object.assign(this.enemies[enemyKey], {x, y})
		});
		
		socket.on("setRotation", (enemyKey, rotation) => {
            this.enemies[enemyKey].rotation = rotation;
        }); 
		socket.on("stopMovingRotation", (enemyKey, rotation) => {
            this.enemies[enemyKey].rotation = rotation;
        });
		socket.on('addEnemy', (enemyKey) => {
			this.addEnemy(enemyKey)
		});

		socket.on('removeEnemy', (enemyKey) => {
			console.log('removeEnemy')
			this.enemies[enemyKey].destroy(true)
			// delete
		});
		
		socket.on('getSoldierLocation', (socketID) => {
			//console.log('getSoldierLocation');
			const { x, y, rotation, name } = this.soldier;
			socket.emit('sendSoldierLocation', socketID, name, x, y, rotation);
		});

		socket.on('setEnemyLocation', (enemyKey, x, y, rotation) => {
			//console.log('setEnemyLocation');
			Object.assign(this.enemies[enemyKey], {x, y, rotation})
		});
		
		socket.on('getEnemies', (enemies) => {
			//console.log(enemies)
			for (let enemy of enemies) {
				this.addEnemy(enemy.name)
			}
		});
		socket.on('bullet', (enemyKey, velocity) => {
			let bullet = this.enemies[enemyKey].weapon.fire()
			if (bullet) bullet.body.setVelocity(velocity.x, velocity.y);
		});
		socket.on('reload', (enemyKey) => {
            this.enemies[enemyKey].weapon.reload();        
		});
		socket.on('selectWeapon', (enemyKey, weaponIndex) => {
			this.enemies[enemyKey].selectWeapon(this.enemies[enemyKey].ammunition[weaponIndex])      
		});

	}

	createBloodEmitter(actor, bullet) {
		let vector = new Phaser.Math.Vector2(bullet.body.velocity);
		vector.normalize()
		let particles = this.add.particles('blood');

		let emitter = particles.createEmitter();
		emitter.setPosition(bullet.x + vector.x*40, bullet.y+ vector.y*40);
		emitter.setSpeed({ min: bullet.body.velocity.x, max: bullet.body.velocity.y });
		emitter.setAngle({ min: bullet.angle -  100, max: bullet.angle - 80 })
		emitter.setQuantity(2)
		emitter.setScale({start: 0.4, end: 0})
		setTimeout( function() {
			particles.destroy();
		}, 100);
	}

	addEnemy (enemyKey) {
		console.log('addEnemy')
		let enemy = new Soldier(this, 200, 2000, enemyKey, 100)
		this.enemies[enemyKey] = enemy
		enemy.ammunition = [WeaponFactory.create(this, enemy, 'handgun')];
		enemy.selectWeapon(enemy.ammunition[0])
		this.physics.add.collider(this.soldier, enemy);
		this.physics.add.overlap(enemy, this.pickedWeapons, enemy.pickUpWeapon);
		this.soldier.ammunition.forEach(gun => {
			this.physics.add.overlap(
			enemy,
			gun.bullets,
			(actor, bullet) => {
			  this.createBloodEmitter(actor, bullet)
			  bullet.kill();
			})
		})
		return enemy
	}

	addEvents() {

		this.input.on('pointermove', (pointer) => {
            const rotation = Phaser.Math.Angle.Between(this.soldier.x, this.soldier.y, pointer.x, pointer.y )
            this.soldier.rotation = rotation
			socket.emit('sendRotation', rotation);
			this.pointer = pointer;
		});

		this.input.on('pointerdown', (pointer) => {
			if (this.soldier.weapon.empty) {
				this.sounds.empty.play()
				return
			} 
			if (!this.soldier.weapon.reloading) {
				this.soldier.startFire()
				socket.emit("startFire");
			}
		});
        
		this.input.on('pointerup', (pointer) => {
			this.soldier.stopFire()
			socket.emit('stopFire')
		});

		this.cursors = this.input.keyboard.addKeys(
			{up:Phaser.Input.Keyboard.KeyCodes.W,
			down:Phaser.Input.Keyboard.KeyCodes.S,
			left:Phaser.Input.Keyboard.KeyCodes.A,
			right:Phaser.Input.Keyboard.KeyCodes.D,
			reload:Phaser.Input.Keyboard.KeyCodes.R});
	
		this.input.on('wheel', function (pointer, gameObjects, deltaX, deltaY, deltaZ) {
			let index = this.scene.soldier.ammunition.indexOf(this.scene.soldier.weapon)
			let newIndex
			if (deltaY < 0) {
				newIndex = index - 1
				if (index == 0) newIndex = this.scene.soldier.ammunition.length - 1
			} else {
				newIndex = index + 1
				if (index == this.scene.soldier.ammunition.length - 1) newIndex = 0
			}
			this.scene.soldier.selectWeapon(this.scene.soldier.ammunition[newIndex])
			socket.emit('selectWeapon', newIndex)
			this.scene.wb.setTexture(this.scene.soldier.ammunition[newIndex].type);
		});	

		
	}

	update(time, delta) {

        let moving = false
		if (this.cursors.reload.isDown) {
			this.soldier.weapon.reload()
			socket.emit('reload')
        }
        if (this.cursors.left.isDown) {
			this.soldier.setVelocityX(-200);
            //this.soldier.x -= this.speed * delta; 
            moving = true
        }
        if (this.cursors.up.isDown)  {
			this.soldier.setVelocityY(-200);
            //this.soldier.y -= this.speed * delta;
            moving = true
        }
        if (this.cursors.right.isDown) {
			this.soldier.setVelocityX(200);
            //this.soldier.x += this.speed * delta;
            moving = true
        }
        if (this.cursors.down.isDown) {
			this.soldier.setVelocityY(200);
            //this.soldier.y += this.speed * delta;
            moving = true
        }
        if (moving) {
            this.soldier.anims.play('walk', true)
			const {x, y} = this.soldier
			socket.emit('sendPosition', x, y);
        } else {
            this.soldier.anims.play('walk', false)
        }
        
	}
}

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
	scene: ShooterGame,
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

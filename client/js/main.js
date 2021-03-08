

// TODO 

// обоймы
// увеличение разроса
// вариация урона в зависимости от пули

import Test from './class.js'

import Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { io } from "socket.io-client";
import Soldier from "./classes/Soldier";
import HealthBar from "./classes/HealthBar";

class StaticGroup extends Phaser.Physics.Arcade.StaticGroup	{	// TODO for large group of static objects
	constructor(scene, children) {
		super(scene.physics.world, scene);
	}
}

var socket;
class WeaponFactory {
	static create(scene, owner, type) {
		if (type === 'handgun')
			return new Weapon(scene, owner, type, 8, 500, 80, 1000, 2, false, false);
		if (type === 'smg')
			return new Weapon(scene, owner, type, 30, 800, 30, 1500, 6, true, false);
		if (type === 'shotgun')
			return new Weapon(scene, owner, type, 18, 750, 100, 1700, 20, false, true);
		if (type === 'rifle')
			return new Weapon(scene, owner, type, 10, 2000, 300, 2000, 0, false, false);
		if (type === 'minigun')
			return new Weapon(scene, owner, type, 300, 1000, 5, 4000, 3, true, false);
	}
}


class Weapon {

	constructor(scene, owner, type, fireLimit, bulletSpeed, fireRate, reloadTime, bulletAngleVariance, fullAuto, multiFire) {
		let gun = scene.add.weapon(fireLimit, 'bullet');
		gun.type = type
		gun.debugPhysics = true;	// TODO remove
		gun.fireLimit = fireLimit
		gun.on(WeaponPlugin.events.WEAPON_FIRE_LIMIT, () => {
			gun.stopFire()
			gun.empty = true
		})
		gun.trackSprite(owner, 0, 0, true);

		//  Because our bullet is drawn facing up, we need to offset its rotation:
		gun.bulletAngleOffset = 90;

		//  The speed at which the bullet is fired
		gun.bulletSpeed = bulletSpeed;

		//  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
		gun.fireRate = fireRate;
		gun.reloadTime = reloadTime;
		gun.fullAuto = fullAuto;
		//gun.multiFire = multiFire
		gun.bulletAngleVariance = bulletAngleVariance;
		gun.empty = false
		gun.bulletKillType = WeaponPlugin.consts.KillType.KILL_WORLD_BOUNDS;
		gun.startFire = this.startFire.bind(gun)
		gun.stopFire = this.stopFire.bind(gun)
		gun.reload = this.reload.bind(gun)
		gun.reloading = false	
		const playerObstacles = owner === scene.soldier ? 
		Object.values(scene.enemies) :
		[...Object.values(scene.enemies).filter(el => el !== owner), scene.soldier]
		scene.physics.add.overlap(
			[...scene.obstacles, ...playerObstacles],
			gun.bullets,
			(actor, bullet) => {
			  // console.log(actor, bullet.damage)
			  if(actor.texture.key === 'soldier') {
				if (actor == scene.soldier) {
					let dead = actor.hb.decrease(5)
					if (dead) {
						scene.soldier.setTexture('soldierdead')	// TODO dead emit
					}
				} else actor.health -= 5;
				scene.createBloodEmitter(actor, bullet)
			  }
			  // console.log(actor.health)
			  bullet.kill();
			}
		  );
		gun.on(WeaponPlugin.events.WEAPON_FIRE, (bullet) => {
			if (owner == scene.soldier) socket.emit('bullet', bullet.body.velocity)
		});
		return gun
	}
	
	reload() {
		if(!this.reloading) {
			this.scene.sounds.reload.play()
			this.reloading = true
			setTimeout(()=>{
				this.resetShots()
				this.empty = false
				this.reloading = false
				this.scene.sounds.reload.stop()
			}, this.reloadTime)
		}
	}
	startFire() {
		
		if(this.fullAuto) {
			this.scene.sounds[this.type].play();
			this.scene.sounds[this.type].setLoop(true)
			this.autofire = true
		} else {
			 if (this.type === 'shotgun') {
				let tmp = this.fireRate
				this.fireRate = 0;
				for (let i = 0; i < this.fireLimit/2; i++) {
					let bullet = this.fire()
					if (bullet) this.scene.sounds[this.type].play();
				}
				this.fireRate = tmp
			} else {
				let bullet = this.fire()
				if (bullet) this.scene.sounds[this.type].play();
			}

		}
	}
	stopFire() {
		if(this.fullAuto) {
			this.autofire = false
			this.scene.sounds[this.type].setLoop(false)
			this.scene.sounds[this.type].stop();
		} 

	}
}

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
		this.load.image('soldier_dead', '/assets/sprites/soldierdead.png');
	    // Load the weapon plugin
  		this.load.script('WeaponPlugin', './plugins/WeaponPlugin.min.js');
		    
		// this.load.scenePlugin({
		// 	key: 'rexUI',
		// 	plugin: RexUIPlugin,
		// 	mapping: 'rexUI'
        // });        
	}

	create() {
		socket = io.connect();
		// Install the weapon pluginClient
		const text = this.add.text(700, 20, 'War never changes...', { fixedWidth: 185, fixedHeight: 36 })
		text.setOrigin(0.5, 0.5)
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
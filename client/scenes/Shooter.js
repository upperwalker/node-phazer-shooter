import Soldier from "../scene_entities/Soldier";
import WeaponFactory from "../scene_entities/WeaponFactory";
import HealthBar from "../scene_entities/HealthBar";
import socket from "../socket";
// TODO обоймы,  увеличение разроса,  вариация урона в зависимости от пули
export default class Shooter extends Phaser.Scene
{
	constructor() {
		super('game');

		this.soldier;
        this.pointer;
		this.inputKeys;
		this.gunsList;
		this.enemies = {};
		this.authState;
	}
	preload() {
		this.load.image('bullet', '../assets/sprites/bullet.png');
		this.load.image('box', '../assets/sprites/box.png');
		this.load.image('blood', '../assets/sprites/blood.png');
		this.load.image('handgun', '../assets/sprites/handgun.png');
		this.load.image('smg', '../assets/sprites/smg.png');
		this.load.image('rifle', '../assets/sprites/rifle.png');
		this.load.image('shotgun', '../assets/sprites/shotgun.png');
		this.load.image('minigun', '../assets/sprites/minigun.png');
		this.load.audio('handgun', '../assets/sounds/handgun.wav')
        this.load.audio('smg', '../assets/sounds/smg.wav')
		this.load.audio('shotgun', '../assets/sounds/shotgun.wav')
		this.load.audio('rifle', '../assets/sounds/rifle.wav')
		this.load.audio('minigun', '../assets/sounds/minigun.wav')
		this.load.audio('reload', '../assets/sounds/reload.wav')
		this.load.audio('empty', '../assets/sounds/empty.wav')

		this.load.audio('paranoid',  '../assets/music/paranoid.mp3');

        this.load.spritesheet('soldier', '../assets/sprites/soldier.png', {
            frameWidth: 49,
            frameHeight: 28,
        });
		this.load.image('soldier_dead', '../assets/sprites/soldierdead.png');
	
		//this.load.bitmapFont('arcade', '../assets/fonts/arcade.png', '../assets/fonts/arcade.xml');
		this.load.bitmapFont('gothic', '../assets/fonts/gothic.png', '../assets/fonts/gothic.xml');
  		this.load.script('WeaponPlugin', '../plugins/WeaponPlugin.min.js');

		// this.load.scenePlugin({
		// 	key: 'rexUI',
		// 	plugin: RexUIPlugin,
		// 	mapping: 'rexUI'
        // });        
	}
	init(authState)
	{
		this.authState = authState;
	}
	async create() {
		// Install the weapon pluginClient
		//this.scene.pause();
		const text = this.add.text(700, 20, 'War never changes...', { fixedWidth: 185, fixedHeight: 36 })
		text.setOrigin(0.5, 0.5)

	


		//this.add.text(0, 560, 'Click user name or password field to edit it\nClick Login button to show user name and password')

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
		this.soldier = new Soldier(this, 200, 2000, this.authState.username, 100)
		this.soldier.ammunition = [WeaponFactory.create(this, this.soldier, 'handgun')];
		this.soldier.hb = new HealthBar(this, this.soldier, 100, 0, 0);
		this.wb = this.add.sprite(105, 9, 'handgun'),
		this.soldier.selectWeapon(this.soldier.ammunition[0])
		this.physics.add.overlap(this.soldier, this.pickedWeapons, this.soldier.pickUpWeapon);
		this.physics.add.collider(this.soldier, this.obstacles);
		this.addEvents();

		const music = this.sound.add('paranoid');
		music.play();

		// socket messages handle
		socket.emit('addSoldier', this.soldier);

		socket.on('setPosition', (enemyKey, x, y) => {
			this.enemies[enemyKey].anims.play('walk', true)
			Object.assign(this.enemies[enemyKey], {x, y})
			Object.assign(this.enemies[enemyKey].bindNickName, {x, y: y - 25})
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
			this.enemies[enemyKey].bindNickName.destroy()
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
			Object.assign(this.enemies[enemyKey].bindNickName, {x, y: y - 25})
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
		socket.on('dead', (enemyKey) => {
			const dead = this.add.sprite(this.enemies[enemyKey].x, this.enemies[enemyKey].y, 'soldier_dead')
			setTimeout(()=> { dead.destroy() }, 1000)
			this.enemies[enemyKey].destroy(true)
			this.enemies[enemyKey].bindNickName.destroy()
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
		enemy.bindNickName = this.add.dynamicBitmapText(enemy.x, enemy.y - 25, 'gothic', enemyKey, 10).setOrigin(0.5);
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
document.addEventListener("visibilitychange", function() {
	if (document.hidden) socket.emit('leave')
	else location.reload()
});

class StaticGroup extends Phaser.Physics.Arcade.StaticGroup	{	// TODO for large group of static objects
	constructor(scene, children) {
		super(scene.physics.world, scene);
	}
}

// TODO 

// обоймы
// увеличение разроса
// подбор орудия с земли done
// спрайты оружия на земле done
// вариация урона в зависимости от пули

class WeaponFactory {
	static create(scene, type) {
		if (type === 'handgun')
			return new Weapon(scene, type, 8, 500, 80, 1000, 2, false);
		if (type === 'smg')
			return new Weapon(scene, type, 30, 800, 30, 1500, 6, true);
		if (type === 'shotgun')
			return new Weapon(scene, type, 18, 750, 100, 1700, 20, false);
		if (type === 'rifle')
			return new Weapon(scene, type, 10, 2000, 300, 2000, 0, false);
		if (type === 'minigun')
			return new Weapon(scene, type, 300, 1000, 5, 4000, 3, true);
	}
}


class Weapon {

	constructor(scene, type, fireLimit, bulletSpeed, fireRate, reloadTime, bulletAngleVariance, fullAuto) {
		let gun = scene.add.weapon(fireLimit, 'bullet');
		gun.type = type
		gun.debugPhysics = true;	// TODO remove
		gun.fireLimit = fireLimit
		gun.on(WeaponPlugin.events.WEAPON_FIRE_LIMIT, () => {
			gun.stopFire()
			gun.empty = true
		})
		gun.trackSprite(scene.soldier, 0, 0, true);

		//  Because our bullet is drawn facing up, we need to offset its rotation:
		gun.bulletAngleOffset = 90;

		//  The speed at which the bullet is fired
		gun.bulletSpeed = bulletSpeed;

		//  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
		gun.fireRate = fireRate;
		gun.reloadTime = reloadTime;
		gun.fullAuto = fullAuto;
		gun.bulletAngleVariance = bulletAngleVariance;
		gun.empty = false
		gun.bulletKillType = WeaponPlugin.consts.KillType.KILL_WORLD_BOUNDS;
		gun.startFire = this.startFire.bind(gun)
		gun.stopFire = this.stopFire.bind(gun)
		gun.reload = this.reload.bind(gun)
		gun.reloading = false
		scene.physics.add.overlap(
			scene.obstacles,
			gun.bullets,
			(actor, bullet) => {
			  bullet.kill();
			}
		  );
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

class Soldier {
	constructor(scene, speed, drag, health) {
	const centerX = scene.cameras.main.width / 2 - 100;
	const centerY = scene.cameras.main.height / 2 - 100;
	let soldier = scene.physics.add.sprite(centerX, centerY, 'soldier');
	soldier.health = health
	soldier.setCollideWorldBounds(true); 
	soldier.setDrag(drag)
	soldier.anims.create({
		key: 'walk',
		frameRate: 5,
		repeat: -1,
		frames: scene.anims.generateFrameNames('soldier', {start: 0, end: 2})
	})
	this.speed = Phaser.Math.GetSpeed(speed, 1);
	soldier.selectWeapon = this.selectWeapon.bind(soldier)
	soldier.startFire = this.startFire.bind(soldier)
	soldier.stopFire = this.stopFire.bind(soldier)
	soldier.pickUpWeapon = this.pickUpWeapon.bind(soldier)
	return soldier
	}
	selectWeapon(newWeapon) {
		this.weapon = newWeapon
		this.scene.wb.setTexture(newWeapon.type);
	}
	pickUpWeapon(player, sprite) {
		sprite.disableBody(true, true);
		let newGun = WeaponFactory.create(player.scene, sprite.texture.key)
		this.selectWeapon(newGun)
		this.ammunition.push(newGun)
	}
	startFire() {
		this.weapon.startFire()
	}
	stopFire() {
		this.weapon.stopFire()
	}
}

class HealthBar {

    constructor (scene, value, x, y)
    {
        this.bar = new Phaser.GameObjects.Graphics(scene);

        this.x = x;
        this.y = y;
        this.value = value;
        this.p = 76 / 100;

        this.draw();

        scene.add.existing(this.bar);
    }

    decrease (amount)
    {
        this.value -= amount;

        if (this.value < 0)
        {
            this.value = 0;
        }

        this.draw();

        return (this.value === 0);
    }

    draw ()
    {
        this.bar.clear();

        //  BG
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, 80, 16);

        //  Health

        this.bar.fillStyle(0xffffff);
        this.bar.fillRect(this.x + 2, this.y + 2, 76, 12);

        if (this.value < 30)
        {
            this.bar.fillStyle(0xff0000);
        }
        else
        {
            this.bar.fillStyle(0x00ff00);
        }

        var d = Math.floor(this.p * this.value);

        this.bar.fillRect(this.x + 2, this.y + 2, d, 12);
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
	}

	preload() {
		this.load.image('bullet', '/assets/sprites/bullet.png');
		this.load.image('box', '/assets/sprites/box.png');
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
	    // Load the weapon plugin
  		this.load.script('WeaponPlugin', './js/WeaponPlugin.min.js');
	}

	create() {
		// Install the weapon plugin
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

		this.obstacles.forEach(el=>el.setPushable(false))
		this.hb = new HealthBar(this, 100, 0, 0);
		this.soldier = new Soldier(this, 200, 2000, 100)
		this.soldier.ammunition = [WeaponFactory.create(this, 'handgun')];
		this.wb = this.add.sprite(105, 9, 'handgun'),
		this.soldier.selectWeapon(this.soldier.ammunition[0])
		this.physics.add.overlap(this.soldier, this.pickedWeapons, this.soldier.pickUpWeapon);
		this.physics.add.collider(this.soldier, this.obstacles);
		this.addEvents();
	}

	addEvents() {

		this.input.on('pointermove', (pointer) => {
            const rotation = Phaser.Math.Angle.Between(this.soldier.x, this.soldier.y, pointer.x, pointer.y )
            this.soldier.rotation = rotation
			this.pointer = pointer;
		});

		this.input.on('pointerdown', (pointer) => {
			if (this.soldier.weapon.empty) {
				this.sounds.empty.play()
				return
			} 
			if (!this.soldier.weapon.reloading) this.soldier.startFire()
		});
        
		this.input.on('pointerup', (pointer) => {
			this.soldier.stopFire()
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
		});	

		
	}

	update(time, delta) {

        let moving = false
		if (this.cursors.reload.isDown) {
			this.soldier.weapon.reload()
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
	scene: ShooterGame
};

const game = new Phaser.Game(config);
import socket from "../socket";
export default class Weapon {

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
						scene.add.sprite(scene.soldier.x, scene.soldier.y, 'soldier_dead')	// TODO gameover
						scene.soldier.visible = false;
						socket.emit('dead')
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
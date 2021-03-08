export default class Soldier {
	constructor(scene, speed, drag, name, health, x = 200, y = 200) {
	let soldier = scene.physics.add.sprite(x, y, 'soldier');
	soldier.name = name || (+new Date * Math.random()).toString(36).substring(0,5) 
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
	soldier.setPushable(false)
	return soldier
	}
	selectWeapon(newWeapon) {
		this.weapon = newWeapon
	}
	pickUpWeapon(player, sprite) {
		sprite.disableBody(true, true);
		let newGun = WeaponFactory.create(player.scene, player, sprite.texture.key)
		if (this.scene.soldier === player) this.scene.wb.setTexture(newGun.type);
		else if (newGun.type === 'shotgun') newGun.multiFire = true;
		this.selectWeapon(newGun)
		this.ammunition.push(newGun)
		console.log('pickUpweapon', this.ammunition)
	}
	startFire() {
		this.weapon.startFire()
	}
	stopFire() {
		this.weapon.stopFire()
	}
}
import Weapon from './Weapon'
export default class WeaponFactory {
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

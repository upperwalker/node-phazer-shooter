		const COLOR_PRIMARY = 0x4e342e;
		const COLOR_LIGHT = 0x7b5e57;
		const COLOR_DARK = 0x260e04;
		
		const GetValue = Phaser.Utils.Objects.GetValue;
		export default function createLoginDialog (scene, config, onSubmit) {
			let username = GetValue(config, 'username', '');
			let title = GetValue(config, 'title', 'Welcome');
			let x = GetValue(config, 'x', 0);
			let y = GetValue(config, 'y', 0);
			let width = GetValue(config, 'width', undefined);
			let height = GetValue(config, 'height', undefined);
		
			let background = scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, COLOR_PRIMARY);
			let titleField = scene.add.text(0, 0, title);
			let userNameField = scene.rexUI.add.label({
				orientation: 'x',
				background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10).setStrokeStyle(2, COLOR_LIGHT),
				icon: scene.add.image(0, 0, 'loginperson'),
				text: scene.rexUI.add.BBCodeText(0, 0, username, { fixedWidth: 150, fixedHeight: 36, valign: 'center' }),
				space: { top: 5, bottom: 5, left: 5, right: 5, icon: 10, }
			})
				.setInteractive()
				.on('pointerdown', function () {
					let config = {
						onTextChanged: function(textObject, text) {
							username = text;
							textObject.text = text;
						}
					}
					scene.rexUI.edit(userNameField.getElement('text'), config);
				});
		
		
			let loginButton = scene.rexUI.add.label({
				orientation: 'x',
				background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, COLOR_LIGHT),
				text: scene.add.text(0, 0, 'Login'),
				space: { top: 8, bottom: 8, left: 8, right: 8 }
			})
				.setInteractive()
				.on('pointerdown', function () {
					loginDialog.emit('login', username);
				});
		
			let loginDialog = scene.rexUI.add.sizer({
				orientation: 'y',
				x: x,
				y: y,
				width: width,
				height: height,
			})
				.addBackground(background)
				.add(titleField, 0, 'center', { top: 10, bottom: 10, left: 10, right: 10 }, false)
				.add(userNameField, 0, 'left', { bottom: 10, left: 10, right: 10 }, true)
				.add(loginButton, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
				.layout();
			return loginDialog;
		};
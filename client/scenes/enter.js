import AuthState from '../state/AuthState'
import createLoginDialog from '../components/LoginDialog'
import animals from 'animals'
export default class Enter extends Phaser.Scene {
    constructor () {
        super('enter')
        this.loginDialog;
    }
    preload() {
        this.load.image('loginperson', '../assets/sprites/loginperson.png');
    }
    async create()
    {
        const text = this.add.text(700, 20, 'War never changes...', { fixedWidth: 185, fixedHeight: 36 })
		text.setOrigin(0.5, 0.5)
        this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#556B2F");
        const authState = new AuthState();
        console.log('%c enter ', 'background: green; color: white; display: block;');
        await authState.getAuth()
        if(authState._authentificated) {
            this.scene.start('game', authState)
        } else {
            let someName = animals()
            someName = someName.charAt(0).toUpperCase() + someName.slice(1)
            const print = this.add.text(0, 0, '');
            this.loginDialog = createLoginDialog(this, {
             x: 400,
             y: 300,
             title: 'Welcome, enter your nickname',
             username: `Private ${someName}`,
         })
             .on('login', async (username) => {
                 print.text += `Login: ${username}\n`;
                 await authState.login({username})
                 this.scene.start('game', authState)
                 this.close()
             })
             .popUp(500);
 
        }
    }
    close() {
        this.loginDialog.scaleDownDestroy(100);
        this.loginDialog = undefined;
    }
}

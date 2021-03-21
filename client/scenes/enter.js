import AuthState from '../state/AuthState'
import createLoginDialog from '../plugins/LoginDialog'
export default new Phaser.Class({

    Extends: Phaser.Scene,


    preload: function () {
        this.load.image('loginperson', '../assets/sprites/loginperson.png');
    },

    initialize:

    function MainMenu ()
    {
        Phaser.Scene.call(this, { key: 'enter' });
        window.MENU = this;
    },

    create: async function ()
    {
        const authState = new AuthState();
        console.log('%c enter ', 'background: green; color: white; display: block;');


        await authState.getAuth()
        if(authState._authentificated) {
            console.log('auth - yes')
                // loginDialog.scaleDownDestroy(100);
             // loginDialog = undefined;
        } else {
         console.log('auth - no')
            const print = this.add.text(0, 0, '');
            const loginDialog = createLoginDialog(this, {
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
 
        }
        //var container = this.add.container(400, 300, [ bg, text ]);

        // bg.setInteractive();

        // bg.once('pointerup', function () {

            console.log(this.scene.start('game'));

        // }, this);
    }

});
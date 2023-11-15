//const checkConnection = require('../helpers/checkConnection');
const axios = require("axios");
var ping = require('ping');
var hostile = require('hostile');

module.exports = async  function (settings) {

   // this.isOnline = await  checkConnection(settings);
    this.isOnline = 1;
    console.log('checkOnlineHelper->',this.isOnline);

   /* if (this.isOnline == 0) {
        this.windows.forEach((win, index) => {
            let currentURL = win.webContents.getURL();
            var strPos = currentURL.indexOf("offline");
            var strPos2 = currentURL.indexOf("error");
            var strPos3 = currentURL.indexOf("splash");

            if((strPos == -1)||(strPos2 == -1)||(strPos3 != -1))
            {
                console.log('current Offline' + currentURL);
                if(settings.urls[index].offlineUrl !='') {
                    win.loadURL(settings.urls[index].offlineUrl);
                }
            }
        });
        if((typeof settings.hidekeyboard!= "undefined") && (settings.hidekeyboard == true))
        {
            axios.post("http://localhost:7000/hidekeyboard").catch(error => {
                console.error('axios post error!', error);
            });
        }
    } else if (this.isOnline && !settings.kasse) {

        this.windows.forEach((win, index) => {
            let currentURL = win.webContents.getURL();
            console.log('current Online ' + this.settings.urls[0].url);
            var strPos = currentURL.indexOf("offline");
            var strPos2 = currentURL.indexOf("error");
            if((strPos!=-1)||(strPos2!=-1))
            {
                if(settings.urls[index].url !='') {
                    win.loadURL(settings.urls[index].url);
                }
            }
        });
    }

    setTimeout(() => {
        this.checkOnline(settings);
    }, 1000);*/
}


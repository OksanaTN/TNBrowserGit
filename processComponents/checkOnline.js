const checkConnection = require('../helpers/checkConnection');
const axios = require("axios");
var ping = require('ping');

module.exports = async  function (settings, noContent) {

    this.isOnline = await checkConnection(this.settings);

    console.log('checkOnlineProcess->',this.isOnline);
    console.log(new Date().toLocaleString())
    if (this.isOnline == 0) {
        this.windows.forEach((win, index) => {
            let currentURL = win.webContents.getURL();
            var strPos = currentURL.indexOf("offline");
            var strPos2 = currentURL.indexOf("error");
            if((strPos == -1 && strPos2 == -1 && currentURL.indexOf("settings") == -1))
            {
                if(settings.urls[index].offlineUrl !='') {
                    win.loadURL(this.settings.urls[index].offlineUrl);
                    console.log('current Offline' + currentURL);
                }
            }
        });
        if((typeof this.settings.hidekeyboard!= "undefined") && (this.settings.hidekeyboard == true))
        {
            axios.post("http://localhost:7000/hidekeyboard").catch(error => {
                console.error('axios post error!', error);
            });
        }


    } else if (this.isOnline == 1 ) {
        var offline  = null;
        this.windows.forEach((win, index) => {
            let currentURL = win.webContents.getURL();

            let notKasse = true;
            if(typeof  this.settings.kasse != "undefined" && this.settings.kasse == true){
                notKasse = false;
            }

            let host = currentURL.replace('https://', '').replace('http://', '');
            var end_url = host.slice(-1);
            if(end_url === '/') {
                host = host.substr(0, (host.length - 1));
            }

            let url =  this.settings.urls[index].url.replace('https://', '').replace('http://', '');
            if(notKasse == true && url.indexOf("display") != -1){
                url = 'tablet.handelsfaktor.de';
            }

            var end_url1 = url.slice(-1);
            if(end_url1 === '/') {
                url = url.substr(0, (host.length - 1));
            }
            console.log('current Online ' + host);
            var strPos = currentURL.indexOf("offline");
            var strPos2 = currentURL.indexOf("error");
            if(  currentURL.indexOf('settings') == -1 && currentURL.indexOf('splash') == -1){

                win.webContents.executeJavaScript(`function gethtml () {
                              return new Promise((resolve, reject) => { resolve(document.body.getElementsByTagName("div").length || document.body.getElementsByTagName("iframe").length); });
                              }
                              gethtml();`).then((html) => {
                        if(html == 0){
                            this.isOnline = 0;
                            console.info('OFFLINE host '+host + 'url '+url)
                            if(currentURL.indexOf('offline') == -1 && currentURL.indexOf('error') == -1) {
                                win.loadURL(this.settings.urls[index].offlineUrl)
                            }
                        } else {
                            if(notKasse == true){
                                if(host != url){
                                    win.loadURL(this.settings.urls[index].url);
                                }
                            }
                        }
                })
            }
        });
    }

    setTimeout(() => {
        this.checkOnline(this.settings);
    }, settings.checkOnlineTimeout);
}

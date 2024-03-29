const {ipcRenderer} = require('electron');

class UpdatePreload {

    constructor() {
        console.log(`start`)
        this.progressbarSelector = document.querySelector('[role="progressbar"]');
        this.progressSelector = document.querySelector('#progress');
        this.checkSelector = document.querySelector('#check');
        this.versiondiv = document.querySelector('#version-text');
        this.cookiesdiv = document.querySelector('#version-text');

        ipcRenderer.send('variable-request', ['version']);

        ipcRenderer.on('message', (event, message) => {
            console.log(`event`, event, message)
            if (message.action) {
                this[message.action](message.data)
            }
        });
        ipcRenderer.on('version', (event, message)=>{
            this.versiondiv.innerHTML = message.version;
        });
        console.log(`typeof restart_browser11:`, typeof restart_browser)
        if (typeof restart_browser === 'function') {
            window.restart_browser = (url) => {
                ipcRenderer.send('restartBrowser', url);
            };
        }
    }

    checkingForUpdate() {
        console.info("checking for update works")
    }

    cheking() {

    }


    updateAvailable() {
        // this.checkTextSelector.innerTEXT = 'Update available, start to download...';
        this.checkSelector.style.display = 'none';
        this.progressSelector.style.display = 'block';
        this.progressbarSelector.style.width = '0%';
        this.progressbarSelector.style.height = '100%';
    }

    download(percents) {
        this.progressbarSelector.style.width = `${percents}%`;
        this.progressbarSelector.style.height = '100%';
    }



}
window.addEventListener('load', () => {
    console.log('-----')
    new UpdatePreload();
});




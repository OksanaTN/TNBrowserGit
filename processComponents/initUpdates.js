const {autoUpdater} = require("electron-updater");
const { ipcMain } = require('electron');
const dns = require("dns");

let { currentVersion } = '';
currentVersion = require('../package.json').version;


autoUpdater.setFeedURL({ provider: 'github', owner: 'OksanaTN', repo: 'TNBrowserGit'});

module.exports = function () {
	 
    this.autoUpdater = autoUpdater;
    this.ipcMain = ipcMain;
    this.innerSettings = this.settings;
   /* if (this.isDev || !this.isOnline) {*/
    if (!this.isOnline) {
        this.start({});
        return
    }

    this.autoUpdater.requestHeaders = {'Cache-Control' : 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'};

    this.autoUpdater.on('checking-for-update', () => {
            console.log('checking');
    })


    this.autoUpdater.on('update-available', (info) => {
        console.log('available');
        this.updateWin.webContents.send('message', {action: 'updateAvailable', data: ''});
    });

    this.autoUpdater.on('update-not-available', (info) => {
        console.log('not-available');
        this.start({});
        this.updateWin.close();
    });

    this.autoUpdater.on('error', (err) => {
        console.log('Error in auto-updater:', err);
        this.start({});
        this.updateWin.close();
    });

    this.autoUpdater.on('download-progress', (progressObj) => {
        this.updateWin.webContents.send('message', {action: 'download', data: progressObj.percent});
    });

    this.autoUpdater.on('update-downloaded', (info) => {
        this.autoUpdater.quitAndInstall('true', true);
    });

    this.updateWin = this._createWindow({
        width: 500,
        height: 100,
        kiosk: true,
        title: this.innerSettings.title + ` - UPDATE`,
        frame: false,
        // webPreferences: {
        //     nodeIntegration: true,
        //     preload: 'update.preload.js',
        // },
        preload: 'update.preload.js',
        
    });

     //this.updateWin.loadFile(`./update.html?version=${currentVersion}`);
    this.updateWin.loadFile(`./update.html`);
    this.updateWin.send('version', {version: currentVersion});
    this.ipcMain.on('variable-request', function (event, arg) {
        console.log(arg);
        // console.log(event.webContents.browserWindowOptions.preference);
         event.sender.send('version', {version: currentVersion});
    });
    console.log('version: ' + currentVersion);
    //this.updateWin.webContents.send('version', {version: currentVersion});
    if (this.innerSettings.debug) {
        this.updateWin.webContents.openDevTools();
    }

    this.autoUpdater.checkForUpdatesAndNotify();

    function checkDns(hostname = this.settings.urls[0].url) {
        return new Promise((resolve, reject) => {
            dns.resolve(hostname, function (err, addr) {
                let isConnected = (err === null);
                resolve(isConnected);
            });
        });
    }


};

const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    session,
    screen,
    contentTracing,
    Notification,
    Menu
} = require('electron');
const  remote  = require('electron').remote;
const isDev = require('electron-is-dev');
const path = require('path');
const fs = require('fs');
const Url = require('url');
const axios = require("axios");
const https = require('https');
var killProcess = require('kill-process-by-name');
const execFile = require('child_process').execFile;
var ping = require('ping');
var hostile = require('hostile');


/*Object.defineProperty(app, 'isPackaged', {
    get() {
        return true;
    }
});*/

let yaml = '';

yaml += "provider: generic\n"
yaml += "url: https://api.github.com/repos/OksanaTN/TNBrowserGit/releases/latest\n"
yaml += "useMultipleRangeRequest: false\n"
yaml += "channel: latest\n"
yaml += "updaterCacheDirName: " + app.getName()

let update_file = [path.join(process.resourcesPath, 'app-update.yml'), yaml]
let dev_update_file = [path.join(process.resourcesPath, 'dev-app-update.yml'), yaml]
let chechFiles = [update_file, dev_update_file]

for (let file of chechFiles) {
    if (!fs.existsSync(file[0])) {
        fs.writeFileSync(file[0], file[1], () => { })
    }
}
const agent = new https.Agent({
    rejectUnauthorized: false
});

const os = require("os");
const { version } = require('./package.json');
const setDebug = require('./helpers/setDebug');
const checkConnection = require('./helpers/checkConnection');
const randomId = require('./helpers/randomId');

const requestMainProcessAction = require('./processComponents/requestMainProcessAction');
const secondInstance = require('./processComponents/secondInstance');
const onPrint = require('./processComponents/onPrint');
const onPrintPDF = require('./processComponents/onPrintPDF');
const initUpdates = require('./processComponents/initUpdates');
const workDirectory = require('./processComponents/workDirectory');
const readyToPrint = require('./processComponents/readyToPrint');
const readyToPrintOther = require('./processComponents/readyToPrintOther');
const defaultSettings = require('./processComponents/defaultSettings');
const checkOnline = require('./processComponents/checkOnline');

const openSettings = require('./actions/openSettings');
const getSettings = require('./actions/getSettings');
const cancelSettings = require('./actions/cancelSettings');

const defaultOfflineUrl = `http://error.kassesvn.tn-rechenzentrum1.de/`;
process.env.ELECTRON_ENABLE_LOGGING = true;


app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('disable-gpu', 'true');
app.commandLine.appendSwitch('touch', 'true');
app.commandLine.appendSwitch('touch-events', 'true');
app.commandLine.appendSwitch('enable-touch-events', 'true');


app.disableHardwareAcceleration();
Menu.setApplicationMenu(false);

class MainProcess {
    constructor() {
        this.app = app;
        this.ipcMain = ipcMain;
        this.screen = screen;
        this.autoUpdater = null;
        this.dialog = dialog;
        this.dirPath = __dirname;
        this.isDev = isDev;
        this.workDirectory = workDirectory(this.isDev);
        this.app.setAppUserModelId('TN Browser');
        this.updateWin =  './processComponents/initUpdates.js';
        this.printWin = null;
        this.winG = null;
        this.win = null;
        this.windows = [];
        this.printers = [];
        this.closedWindowIndexes = [];
        this.isRedirectedToError = false;
        this.isOnline = null;
        this.remote = remote;
        this.hostName = os.hostname();


        this.initSettings();

        app.commandLine.appendSwitch('disable-http2');
        /* - Bind Methods -*/
        this.initUpdates = initUpdates.bind(this);
        this.setDebug = setDebug.bind(this);
        this.checkOnline = checkOnline.bind(this);
        this.settings.version = version;
        /* - Bind Actions -*/
        this.openSettings = openSettings.bind(this, this.hostName);
        this.getSettings = getSettings.bind(this);
        this.cancelSettings = cancelSettings.bind(this);
        this.cookiesInfo = new Array();
        this.init();
    }

    async init() {
        console.info("MAIN INIT!");
        const isMain = this.app.requestSingleInstanceLock();
        if (!isMain){

           /* killProcess('TN-Browser');
            console.error(`another instance already running`);
            setTimeout(function (){
            execFile( 'TN-Browser.exe', ['--version'], {cwd: process.cwd(), encoding: 'utf8'}, (error, stdout, stderr) => {
                if (error) {
                    console.error(`error: ${error.message.toString()}`);
                    return;
                }

                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return;
                }

                console.log(`stdout:\n${stdout}`);
            });
            }, 1000);*/
            const oldWindows = [].concat(this.windows);
            this.clearCache();
            oldWindows.forEach((item, index) => {
                item.hide();
            });

            this.start({ skipSplash: true });

            oldWindows.forEach((item) => {
                item.close();
            });

        } else {
            this.isOnline = await checkConnection(this.settings);
            console.log(`isOnline: `, this.isOnline);
            this.initEvents();

            /*try{
                this.initUpdates();
            }
            catch (error) {
                console.log('error update')
                await this.app.whenReady().then(() => {
                    this.start({})
                })
            };*/
            await this.app.whenReady().then(() => {
                //session.defaultSession.clearStorageData();
                (async () => {
                    this.cookies =   await this.getCookie( function(returnValue){})
                   // console.info( this.cookies)

                })
            })
            this.start({})
           //

            // await this.app.whenReady().then(() => {
            //     (async () => {
            //       await contentTracing.startRecording({
            //         included_categories: ['*']
            //       })
            //       console.log('Tracing started')
            //       await new Promise(resolve => setTimeout(resolve, 5000))
            //       const path = await contentTracing.stopRecording()
            //       console.log('Tracing data recorded to ' + path)
            //     })()
            //   }

        }
    }

    async initSettings() {

        const settingsFilePath = path.resolve(
            `${this.workDirectory}/settings.json`
        );
        if (fs.existsSync(settingsFilePath)) {
            const settingsFile = fs.readFileSync(settingsFilePath, 'utf8');
            try {
                const settings = JSON.parse(settingsFile);

                this.settings = {
                    version,
                    ...this.settings,
                    ...settings,
                    isOnline: this.isOnline
                };

                if((this.settings.kasse == false || typeof this.settings.kasse == "undefined") && this.isOnline)
                {
                    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
                    axios.get("https://vr-ekiosk.app/tntools/get_kiosk_cookies.php?name="+this.hostName).then((res) => {

                        if((typeof res.data != "undefined")&&(typeof res.data.location != "undefined"))
                        {
                            var expiration = new Date();
                            var hour = expiration.getHours() + 24;
                            expiration.setHours(hour);
                            this.settings.urls[0].url = res.data.location;
                            const cookie_arr = [
                                { url: res.data.location, name: 'kasse_id', value: res.data.kasse_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                                { url: res.data.location, name: 'kasse_user_id', value: res.data.kasse_user_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                                { url: res.data.location, name: 'terminal_id', value: res.data.terminal_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                                { url: res.data.location, name: 'partner_id', value: res.data.partner_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                                { url: res.data.location, name: 'kunde_id', value: res.data.kunde_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                                { url: res.data.location, name: 'filial_id', value: res.data.filial_id.toString(), 'path':'/', expirationDate: expiration.getTime()}
                            ];

                            session.defaultSession.clearStorageData();
                            cookie_arr.forEach((cookie)=>{
                                session.defaultSession.cookies.set(cookie)
                                    .then(() => {
                                        // success
                                    }, (error) => {
                                        console.error(error)
                                    })
                            });
                        }
                    }).catch(error => console.log(error));
                } else {


                   // session.defaultSession.clearStorageData();

                }

                this.settingsMigration();
            } catch (e) {
                console.error(
                    `Something went wrong! settings.json is not JSON`
                );
            }
        } else {

            this.settings = defaultSettings({
                version,
                workDirectory: this.workDirectory,
                isDev
            });

            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

            axios.get("https://vr-ekiosk.app/tntools/get_kiosk_cookies.php?name="+this.hostName).then((res) => {

                if((typeof res.data != "undefined")&&(typeof res.data.location != "undefined"))
                {

                    session.defaultSession.clearStorageData();
                    var expiration = new Date();
                    var hour = expiration.getHours() + 24;
                    expiration.setHours(hour);
                    this.settings.urls[0].url = res.data.location;
                    console.info(this.settings)
                    this.saveSettingsInit('init', this.settings);
                    const cookie_arr = [
                        { url: res.data.location, name: 'kasse_id', value: res.data.kasse_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'kasse_user_id', value: res.data.kasse_user_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'terminal_id', value: res.data.terminal_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'partner_id', value: res.data.partner_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'kunde_id', value: res.data.kunde_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'filial_id', value: res.data.filial_id.toString(), 'path':'/', expirationDate: expiration.getTime()}
                    ];

                    cookie_arr.forEach((cookie)=>{
                        session.defaultSession.cookies.set(cookie)
                            .then(() => {
                                // success
                            }, (error) => {
                                console.error(error)
                            })
                    });
                }
            }).catch(error => console.log(error));


        }


        return;
    }

     getCookie(callback) {
         return new Promise(function(resolve, reject) {
             session.defaultSession.cookies.get({})
                 .then((cookies) => {
                     let cookieStr = '<table class="table">';
                     for (var i = 0; i < cookies.length; i++) {
                         let info = cookies[i];
                         cookieStr += '<tr><td>'+info.name+'</td><td>'+info.value+'</td></tr>';
                         let somevalue = info.value;
                     }
                     cookieStr += '</table>';
                     resolve(cookieStr)
                 }).catch((error) => {
                 console.log(error)
             })
         })
        //alert(somevalue); //alert 2
    }

    settingsMigration() {
        this.settings.urls = this.settings.urls.map((item) => {
            if (!item.hasOwnProperty('offlineUrl')) {
                item.offlineUrl = defaultOfflineUrl;
            }

            if (!item.hasOwnProperty('zoom')) {
                item.zoom = 1;
            }
            return item;
        });
    }


    showNotification (title, body) {
        new Notification({ title: title, body: body }).show()
    }

    isRunning(win, mac, linux){

        return new Promise(function(resolve, reject){
            const plat = process.platform
            const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
            const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
            if(cmd === '' || proc === ''){
                resolve(false)
            }
            exec(cmd, function(err, stdout, stderr) {
                resolve(stdout.toLowerCase().indexOf(proc.toLowerCase()) > -1)
            })
        })
    }

    initEvents() {
        this.app.on('second-instance', secondInstance.bind(this));

        this.app.on('window-all-closed', () => {
            this.app.quit();
        });
        this.app.on('child-process-gone', (e, detaisls) => {
            console.log('render-process-gone', details);
            this.app.relaunch();
            this.app.quit();
        });

        this.ipcMain.on(
            'request-mainprocess-action',
            requestMainProcessAction.bind(this)
        );


        this.ipcMain.on('print', onPrint.bind(this));
        this.ipcMain.on('printPdf', onPrintPDF.bind(this));
        this.ipcMain.on('readyToPrint', readyToPrint.bind(this));
        this.ipcMain.on('readyToPrintOther', readyToPrintOther.bind(this));
        this.ipcMain.on('show-context-menu', (event) => {
            return false;
        });


    }

    reopenWindows() {
        console.info('reopen')
        this.closedWindowIndexes.forEach((itemIndex) => {

            this.openWorkWindow({
                windowItem: this.settings.urls[itemIndex],
                index: itemIndex,
                skipSplash: true,
            });

        });
        this.checkOnline(this.settings);
        this.closedWindowIndexes = [];
    }


    openWorkWindow({ windowItem, index, skipSplash }) {
        const sign = randomId();
        const isPrimary = index === 0;
        var win = this.createWindow({ ...windowItem, sign, index }, isPrimary);

        this.windows.push(win);
        console.info('create Work ' + index)
       /* win.webContents.session.enableNetworkEmulation({
            latency: 500,
            downloadThroughput: 6400,
            uploadThroughput: 6400
        })
*/
// To emulate a network outage.
       // win.webContents.session.enableNetworkEmulation({ offline: true })

        win.on('close', (event) => {
            const foundIndex = this.windows.findIndex((item) => {
                return (
                    item.webContents.browserWindowOptions.preference.sign ===
                    sign
                );
            });
            console.info('foundIndex' + foundIndex)
            if (foundIndex !== -1) {
                this.windows.splice(foundIndex, 1);
                if(this.closedWindowIndexes.length < 1) {
                    this.closedWindowIndexes.push(index);
                }
                win = null;
            } else {
                console.error(
                    `close foundIndex not found`,
                    foundIndex,
                    windowItem
                );
            }
        });
        win.on('closed', (event) => {
            win = null;

        });



        win.webContents.on('will-navigate', (event, url) => {
            /*var testUrl = Url.parse(url);
            let allowedUrls = [];
            this.settings.urls.forEach(element => {
                let testUrl1 = Url.parse(element.url);
                let testUrl2 = Url.parse(element.offlineUrl);
                allowedUrls.push(testUrl1.host, testUrl2.host);
            });
            this.settings.whitelist.forEach(element => {
                let testUrl1 = Url.parse(element);
                allowedUrls.push(testUrl1.host);
            });
            if(!allowedUrls.includes(testUrl.host))
            {
                this.showNotification('Error', 'Forbidden link');
                event.preventDefault();
            }*/
            /*
            console.log(win.webContents.findInPage('iframe'));
            console.log(win.webContents.executeJavaScript(`function gethtml () {
                return new Promise((resolve, reject) => { resolve(document.getElementsByTagName("iframe")); });
                }
                gethtml();`).then((html) => {
            // var title = html.match(/<iframe[^>]*>([^<]+)<\/iframe>/);
            console.log(html);
                // sending the HTML to the function extractLinks
                // extractLinks(html)
              }));
            */

        });

        win.webContents.on('close', (event) => {

            this.winG = null;
        });


        if(typeof this.settings.kasse === 'undefined')
        {

            win.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures, referrer, postBody) => {
                event.preventDefault();
                this.winG = null;
                this.winG = new BrowserWindow({
                    webContents: options.webContents, // use existing webContents if provided
                    width: this.settings.guestwidth,
                    height: this.settings.guestheight,
                    icon: './assets/favicon_new.ico',
                    show: false,
                    webPreferences: {
                        nativeWindowOpen: true,
                        webSecurity: false,
                        allowRunningInsecureContent: true,
                        enableRemoteModule: true,
                        preload: path.join(__dirname, 'preload.js'), // use a preload script
                    },
                })
                this.winG.setKiosk(false);
                this.winG.removeMenu();
                this.winG.once('ready-to-show', () => this.winG.show());

                this.winG.on('close', (event) => {
                    if(typeof window !== 'undefined') {
                        this.winG.delete(window);
                    }
                    this.winG = null;
                });

                this.winG.on('closed', (event) => {
                    this.winG = null;
                });

                if (!options.webContents) {
                    const loadOptions = {
                        httpReferrer: referrer
                    }
                    if (postBody != null) {
                        const { data, contentType, boundary } = postBody
                        loadOptions.postData = postBody.data
                        loadOptions.extraHeaders = `content-type: ${contentType}; boundary=${boundary}`
                    }

                    this.winG.loadURL(url, loadOptions) // existing webContents will be navigated automatically
                 } else {
                    this.winG.closable = true

                    this.winG.loadURL(url)
                }
                event.newGuest = this.winG
            });
        }

        //   win.webContents.on(
        //     'did-frame-navigate',
        //     (event, url, httpResponseCode, httpStatusText, isMainFrame, frameProcessId, frameRoutingId) => {
        //         console.log(url);
        //         console.log("isMainFrame->"+isMainFrame);
        //         const frame = webFrameMain.fromId(frameProcessId, frameRoutingId)

        //     }
        //   )
        /*win.webContents.on('frame-created', (event, details)=>{
            console.log('iframe');

        });*/


        /* win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
             console.log(details.responseHeaders);
             console.log('seek iframe');
             callback({ responseHeaders: Object.fromEntries(Object.entries(details.responseHeaders).filter(header => !/x-frame-options/i.test(header[0]))) });
         });
*/
        win.loadFile('./splash.html');

        win.send('version', {version: version});

        win.webContents.on('dom-ready', () => {
            // we can get its URL and display it in the console
            let currentURL = win.getURL()
              console.log('currentURL is : ' + currentURL)

            // same thing about the title of the page
            let titlePage = win.getTitle()
            //console.log('titlePage is : ' + titlePage)


        })

        win.webContents.once('did-finish-load', () => {

            setTimeout(
                () => {
                    this.isOnline = this.checkOnline(this.settings);
                    this.isOnline ? win.loadURL(windowItem.url):win.loadURL(windowItem.offlineUrl);
                },
                skipSplash ? 10 : this.settings.splashScreenTimeout
            );

        });

        if( this.settings.debug === true)
        {
            win.webContents.openDevTools();
        }

        this.removeMenu(win);

        if (!this.isOnline) {
            // windowItem.url = windowItem.offlineUrl;
            this.isRedirectedToError = true;
        }

    }


    start({ skipSplash = false }) {
        console.log("THIS START!!!!!!!!!!")
       const displays = this.screen.getAllDisplays();
       var i=0;
       displays.forEach((display, index) => {
           let windowItem = this.settings.urls[index];
           if(typeof  windowItem != "undefined") {
               windowItem.displayId = displays[index].id
           }
           this.openWorkWindow({windowItem, index, skipSplash});
       });
       /*this.settings.urls.forEach((windowItem, index) => {
           if(i < displays.length) {
               windowItem.displayId = displays[i].id
               this.openWorkWindow({windowItem, index, skipSplash});
               i++;
           }
       });*/


       setTimeout(() => this.clearCache(), 10);


        this.screen.on('display-added', (event, display) => {
             var skipSplash1 = true;
                var i=0;
            const oldWindows = [].concat(this.windows);
            this.clearCache();
            oldWindows.forEach((item, index) => {
                item.hide();
            });

            this.start({ skipSplash: true });

            oldWindows.forEach((item) => {
                item.close();
            });
        })

        this.screen.on('display-removed', (event, display) => {
            const oldWindows = [].concat(this.windows);
            console.info(display.id)
            this.clearCache();
            oldWindows.forEach((item, index) => {
                if(item.displayId == display.id)
                {
                    item.hide();
                }
            });
            this.start({ skipSplash: true });

            oldWindows.forEach((item) => {
                    item.close();
            });
        });

    }


    _createWindow({
                      width,
                      height,
                      kiosk,
                      title,
                      frame,
                      preload,
                      x = 0,
                      y = 0,
                      preference = null,
                  }) {

        return new BrowserWindow({
            width,
            height,
            kiosk,
            title,
            frame,
            icon: './assets/favicon_new.ico',
            preference,
            webPreferences: {
                nodeIntegration: false,
                nativeWindowOpen: true,
                webSecurity: false,
                allowRunningInsecureContent: true,
                enableRemoteModule: true,
                preload: path.join(__dirname, preload), // use a preload script
                nodeIntegrationInSubFrames:true,
            },
            x,
            y,
        });
    }

    createWindow(windowItem, isPrimary) {
        const displays = this.screen.getAllDisplays();

        let externalDisplay = displays.find((display) => {
            return display.id === windowItem.displayId;
        });

        let position = {
            x: 0,
            y: 0,
        };

        if (externalDisplay) {
            position.x = externalDisplay.bounds.x + 50;
            position.y = externalDisplay.bounds.y + 50;
        }

        const win = this._createWindow({
            width: this.settings.guestwidth,
            height: this.settings.guestheight,
            kiosk: isPrimary ? this.settings.kiosk : true,
            title: this.settings.title,
            frame: this.settings.frame,
            preference: windowItem,
            ...position,
            preload: 'preload.js'
        });



        this.printers = win.webContents.getPrinters();
        return win;
    }


    removeMenu(win) {
        if (!this.settings.showMenu) {
            if (typeof win.removeMenu === 'function') {
                win.removeMenu();
            } else {
                win.setMenu(null);
            }
        }
    }

    saveSettingsInit(event, arg) {
       // console.log(`Settings Saved: `, arg);
        // event, arg
        fs.writeFileSync(
            `${this.workDirectory}/settings.json`,
            JSON.stringify(arg, null, '\t')
        );

    }

    saveSettings(event, arg) {

        // event, arg
        fs.writeFileSync(
            `${this.workDirectory}/settings.json`,
            JSON.stringify(arg.data, null, '\t')
        );

        this.initSettings();

        const oldWindows = [].concat(this.windows);
        // this.windows = [];
        this.clearCache();
        oldWindows.forEach((item, index) => {
            item.hide();
        });

        this.start({ skipSplash: true });

        oldWindows.forEach((item) => {
            item.close();
        });
        console.info('res3');
        console.info(this.hostName)
        if(this.settings.kasse == false )
        {
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            axios.get("https://vr-ekiosk.app/tntools/get_kiosk_cookies.php?name="+this.hostName).then((res) => {

                if((typeof res.data != "undefined")&&(typeof res.data.location != "undefined"))
                {
                    var expiration = new Date();
                    var hour = expiration.getHours() + 24;
                    expiration.setHours(hour);
                    this.settings.urls[0].url = res.data.location;
                    const cookie_arr = [
                        { url: res.data.location, name: 'kasse_id', value: res.data.kasse_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'kasse_user_id', value: res.data.kasse_user_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'terminal_id', value: res.data.terminal_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'partner_id', value: res.data.partner_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'kunde_id', value: res.data.kunde_id.toString(), 'path':'/', expirationDate: expiration.getTime()},
                        { url: res.data.location, name: 'filial_id', value: res.data.filial_id.toString(), 'path':'/', expirationDate: expiration.getTime()}
                    ];

                    session.defaultSession.clearStorageData();
                    cookie_arr.forEach((cookie)=>{
                        session.defaultSession.cookies.set(cookie)
                            .then(() => {
                                // success
                            }, (error) => {
                                console.error(error)
                            })
                    });
                }
            }).catch(error => console.log(error));
        } else {
            setTimeout(() => this.clearCache(), 10);
        }

        //setTimeout(() => this.openSettings(), 10);

        // console.log(oldWindows)
    }

    async flushStore() {
        for (let i in this.windows) {
            await this.windows[i].webContents.session.clearStorageData();
            this.windows[i].reload();
        }
    }

    async clearCache(reload = true) {
        console.log('clean cache');
        for (let i in this.windows) {
            await this.windows[i].webContents.session.clearCache();
            // if (reload) this.windows[i].reload();
        }
    }

    // async sendCoords(event, arg) {
    //     try
    //     {
    //         const response = await fetch('http://localhost:7000/coordinates', {method: 'POST', body: arg.data});
    //     }
    //     catch(e){
    //         console.log(e);
    //     }
    // }

    goToOffline() {
        let options = {
            buttons: ['Ja', 'Nein'],
            message: 'Möchten Sie in die Offline-Version wechseln?',
        };
        dialog.showMessageBox(options).then((response) => {
            if (response.response == 0) {
                for (let i in this.windows) {
                    this.windows[i].loadURL(
                        this.windows[i].webContents.browserWindowOptions
                            .preference.offlineUrl
                    );
                }
            }
        });
        // console.log(response);
    }

    async openDevTools() {
        for (let i in this.windows) {
            await this.windows[i].webContents.openDevTools();
        }
    }



     resetApp() {
        this.app.relaunch()
        this.app.exit()
    }


}

new MainProcess();

module.exports = function ({ workDirectory, version, isDev }) {
    return {
        width: 800,
        height: 600,
        kiosk: true,
        title: 'TN-Browser',
        frame: true,
        offlineUrl: '',
        buttonPosition: 'TOP_RIGHT', // TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT
        buttonMargin: '10px 10px 10px 10px',
        showMinimizeButton: false,
        showOfflineButton: false,
        minimizeIconUrl:
            'https://damfastore-magdeburg.kassesvn.tn-rechenzentrum1.de/img/fullscreen_close.png',
        maximizeIconUrl:
            'https://damfastore-magdeburg.kassesvn.tn-rechenzentrum1.de/img/fullscreen_open.png',
        debug: isDev,
        splashScreenTimeout: 3000,
        checkOnlineTimeout: 10000,
        devShowPrintWindow: false,
        workDirectory,
        showMenu: false,
        isDev,
        urls: [
            {
                url:
                    'https://damfastore-magdeburg.kassesvn.tn-rechenzentrum1.de/',
                displayId: 0,
                offlineUrl: 'http://error.kassesvn.tn-rechenzentrum1.de/',
                zoom: 1,
            },
        ],
        version,
        printFont: 'Arial',
        whitelist : [],
        ticketPrinter: 'Boca BIDI FGL 26/46 200 DPI',
        changeFont:true,
        guestwidth:1020,
        guestheight:1300,
        checkOnlineUrl:'www.google.com',
        VRKiosk:false
    };
};

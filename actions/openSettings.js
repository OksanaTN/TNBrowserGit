const { BrowserWindow, BrowserView } = require('electron');

module.exports = function(event, arg) {

    BrowserWindow.getFocusedWindow().loadFile('./settings.html');
}

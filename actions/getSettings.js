module.exports = function(event, arg) {
    event.sender.send('mainprocess-response', {
        action: 'init',
        settings: this.settings,
        displays: screen.getAllDisplays(),
    });
}

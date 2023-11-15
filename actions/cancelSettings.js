

module.exports = function(event, arg) {
    let i=0;
    this.settings.urls.forEach((windowItem, index) => {
        this.isOnline ? this.windows[i].loadURL(this.settings.urls[i].url) : this.windows[i].loadURL(this.settings.urls[i].offlineUrl) ;
        i++;
    });

}

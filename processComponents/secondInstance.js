module.exports = function (event, commandLine, workingDirectory, additionalData) {

    this.reopenWindows();
    this.windows.forEach((win) => {
        if (win.isMinimized()) {
            win.restore();
        }
        win.focus();
    })
};

module.exports = function (event, arg) {
    console.log('action:', arg.action)
    this[arg.action](event, arg);
}

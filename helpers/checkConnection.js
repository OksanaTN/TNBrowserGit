var ping   = require('ping');
var spawn = require('child_process').spawn;


var checkConnection = function(settings){
    return new Promise((resolve, reject) => {
        let host = settings.urls[0].url.replace('https://', '').replace('http://', '');
        var end_url = host.slice(-1);
        if(end_url === '/') {
            host = host.substr(0, (host.length - 1));
        }

        ping.sys.probe(host, function (isAlive) {
            var msg = isAlive ? 1 : 0;
            console.info("CONNECTION HOST: "+host + '; msg ' + msg)
                resolve(msg);
        }, {timeout: 5000});
    });
};

module.exports = exports = checkConnection;
const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const request = require('request');
const ptp  =  require("pdf-to-printer");
const os = require("os");
const Url = require('url');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = function (event, url) {
   console.info('sdfsdf');
   console.info(app);

};

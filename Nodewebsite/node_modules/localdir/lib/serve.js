var Q = require('q');
var _ = require('lodash');

var http = require('http');
var send = require('send');

var url = require('url');

function serveDir(dir, port) {

    var d = Q.defer();

    var server = http.createServer(function(req, res){
        // Render error
        function error(err) {
            res.statusCode = err.status || 500;
            res.end(err.message);
        }

        // Redirect to directory's index.html
        function redirect() {
            res.statusCode = 301;
            res.setHeader('Location', req.url + '/');
            res.end('Redirecting to ' + req.url + '/');
        }

        // Send file
        send(req, url.parse(req.url).pathname)
        .root(dir)
        .on('error', error)
        .on('directory', redirect)
        .pipe(res);
    }).listen(port);

    d.resolve(server);

    return d.promise;
}

function logError(err) {
    console.log(err.stack || err.message || err);
    return Q.reject(err);
};


// Exports
module.exports = {
    serveDir: serveDir,
    logError: logError
};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var WebSocketServer = require('websocket').server;
var fs = require('fs');
var config = require('./config');
var http = require('http');
if (config.ssl) {
    http = require('https');
}

var options = {};
if (config.ssl) {
    options = {
        key: fs.readFileSync(config.keyPath),
        cert: fs.readFileSync(config.certPath)
    };
}

var server = http.createServer(options, function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(config.port, function() {
    console.log((new Date()) + ' Server is listening on port ' + config.port);
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
}, function(req, res) {

    console.log('req');

    res.writeHeader(200, { 'Content-Type': 'text/plain' });
    res.write('test');
    res.end();

});

var connections = {}
var configMap = {}

wsServer.on('request', function(request) {
    var id = uid();
    var connection = request.accept();

    var instance = {
        id: id,
        connection: connection,
        configs: {}
    }

    connections[id] = instance

    instance.connection.on('message', function(msg) {
        var message = parseMessage(msg)
        console.log('message recieved', message)
        treatMessages(message, id)
    });
    connection.on('close', function(reasonCode, description) {
        connections[id] = null;
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

function treatMessages(datas, id) {
    if (!connections[id]) {
        return true
    }
    if (datas && Array.isArray(datas) && datas.length) {
        datas.map(function(data) {
            treatMessage(data, id)
        })
    }
    return false;
}

function treatMessage(data, id) {
    if (data) {
        if (data.type == 'configure') {
            configure(id, data)
        }
        if (data.type == 'notify') {
            notify(id, data)
        }
    }
}

function configure(id, data) {
    var instance = connections[id]
    if (instance) {
        instance.configs[data.key] = data.value;
        if (!configMap[data.key]) {
            configMap[data.key] = {}
        }
        configMap[data.key][id] = instance
        console.log(id, ' configured as ', data.key)
    }
}

function notify(id, data) {
    if (!configMap[data.key]) {
        return false
    }
    Object.keys(configMap[data.key]).map(function(id) {
        sendMessage(id, data.message)
    })
}

function broadCast(message) {
    Object.keys(connections).map(function(id) {
        sendMessage(id, message)
    })
}

function sendMessage(id, message) {
    var instance = connections[id]
    if (instance) {
        instance.connection.sendUTF(message);
    }
}

function uid() {
    return 'uid' + (new Date).getTime()
}

function parseMessage(msg) {
    if (msg.type === 'utf8') {
        return json_decode(msg.utf8Data);
    }
    return null;
}

function json_encode(data) {
    return JSON.stringify(data)
}

function json_decode(elt) {
    var r = null
    try {
        r = JSON.parse(elt);
    } catch (e) {
        r = null
    }
    return r;
}
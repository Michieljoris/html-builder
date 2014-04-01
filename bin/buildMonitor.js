#!/usr/bin/env node

/*global exports:false require:false process:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:6 maxcomplexity:10 maxlen:190 devel:true*/
// var sys = require('sys');

var filemon = require('filemonitor');
//don't forget to install inotify-tools for filemonitor!!!
require('colors');
var argv = require('optimist').argv;

var build = require('../src/html-builder.js').build;
var WebSocket = require('ws');
var websocket;


// function addDirToMonitor(partial) {
//    if (partial.partialsDir && monitoredDirs.indexOf(partial.partialsDir) === -1)
//        monitoredDirs.push(partial.partialsDir);
// }

function monitor(dataFileName) {
    var isHtml = /.*\.html?$/;
    var isMdown = /.*\.mdown?$/;
    var isMarkdown = /.*\.markdown?$/;
    var isMd = /.*\.md?$/;
    var isJs = /.*\.js?$/;
    // function puts(error, stdout, stderr) { sys.puts(stdout); }
    // log(datajs);

    var lastEvent = {
        timestamp: '',
        filename: ''
    };
    
    var onFileEvent = function (ev) {
        // var filetype = ev.isDir ? "directory" : "file";
        console.log(ev.filename);
        // var i = ev.filename.lastIndexOf('/');
        // var dir = ev.filename.slice(0, i+1);
        // log(dir, ev.filename);
        
        if (ev.filename === dataFileName ||
            // (target.indexOf(dir) !== -1 && (
            isMdown.test(ev.filename) ||
            isMarkdown.test(ev.filename) ||
            isMd.test(ev.filename) || 
            isHtml.test(ev.filename) ||
            isJs.test(ev.filename)
            // || true
           )
            
            // ))
        {
            // log(ev.timestamp);
            if (lastEvent.timestamp.toString() === ev.timestamp.toString() &&
                lastEvent.filename === ev.filename) return;
            lastEvent = ev;
            console.log('Modified>> '.green + ev.filename.yellow);
            // filemon.stop(function() {
                
            // });
            
            build(function() { return websocket; });
            // log('Building ' + buildData.out);
            // exec("lispy -r " + ev.filename, puts);
            // var buildData = evalFile(dataFileName);
            // buildData.partialsPath = trailWith( buildData.partialsPath, '/');
            // // log(buildData.title);
            
            // render();
            // log("Event " + ev.eventId + " was captured for " +
            //             filetype + " " + ev.filename + " on time: " + ev.timestamp.toString());
            // }
        }
    };
    // var i = dataFileName.lastIndexOf('/');
    // var dir = dataFileName.slice(0, i+1);
    // target.push(dir);
    // log(dir);
    // console.log(monitoredDirs);
    var options = {
        target: monitoredDirs,
        recursive: true,
        listeners: {
            modify: onFileEvent
        }
    };
    
    console.log('Watching ' + monitoredDirs.toString());
    filemon.watch(options); 
} 

function reload(buildData) {
    
    // try { 
    //     if (buildData.reload && buildData.reload.enable) {
    //         console.log('Sending reload msg to ' + buildData.reload.url);
            
    //         ws.on('open', function() {
    //             ws.send('reload');
    //         });
    //         ws.on('message', function(data, flags) {
    //             console.log('Incoming msg!!', data, flags);
    //             // flags.binary will be set if a binary data is received
    //             // flags.masked will be set if the data was masked
    //         });  
    //         ws.on('error', function() {
    //             console.log('ERROR!!!', );
    //             // flags.binary will be set if a binary data is received
    //             // flags.masked will be set if the data was masked
    //         });  
    //     }
    // } catch(e) { console.log('error', e); };
    
    // if (!url) return;
    // var WebSocket = require('ws');
    // var ws = new WebSocket('ws://' + url);
    // ws.on('open', function() {
    //     ws.send('reload');
    // });
    // ws.on('message', function(data, flags) {
    //     console.log(data, flags);
    //     // flags.binary will be set if a binary data is received
    //     // flags.masked will be set if the data was masked
    // });

}

if (argv.h || argv.help) {
    console.log([
        "usage: monitor [pathToData.js]"
    ].join('\n'));
    process.exit();
}



// console.log('Arguments', argv);
var monitoredDirs = [];
var dir = argv.c || process.cwd() + '/build/';

function enableWebsocket() {
    console.log('Html-builder: Connecting to ', url);
        var probe;
        var tried = 0;
    function connect() {
        if (tried === 0) {
            console.log('Trying to connect to ' + url);
        }
        else process.stdout.write('.');
            websocket = new WebSocket(url);
    
        // When the connection is open, send some data to the server
        websocket.onopen = function () {
                
            websocket.send('buildMonitor connected');
            console.log('\nbuildMonitor connected to ' + url);
            clearTimeout(probe);
            tried = 0;
        };

        // Log errors
        websocket.onerror = function (error) {
            // console.log("ERROR", err);
        };

        // Log messages from the server
        websocket.onmessage = function (e) {
            clearTimeout(probe);
            console.log('Server: ' , e.data);
            // if (e.data === "reload") {
            //     location.reload();
            // }
        };
        
        websocket.onclose = function (e) {
            console.log("Connection closed..");
            probe = setInterval(function() {
                connect();
            },1000);
        };
        tried++;
    }
    
    probe = setInterval(function() {
        connect();
    },1000);
};
var url = argv.s; //|| 'ws://localhost:8080';
console.log('url =', url);
if (url) enableWebsocket();


// var websocket = new WebSocket(url);

// websocket.on('open', function() {
//     websocket.send('buildMonitor connected');
// });

// websocket.on('error', function(err) {
//     console.log('Not able to connect to ' + url);
//     console.log("ERROR", err);
// });
build();

monitoredDirs.push(dir);
monitor(dir + 'recipe.js');


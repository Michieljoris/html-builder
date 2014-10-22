#!/usr/bin/env node

var argv = require('optimist').argv;
var websocketIsOpen;

if (argv.h || argv.help) {
    console.log([
        "usage: monitor [pathToData.js]"
    ].join('\n'));
    process.exit();
}

var recipe = argv.r || 'build/recipe.js';
var url = argv.s; //|| 'ws://localhost:8080';
var dir = argv.d || process.cwd() + '/build/';
var scripts = argv.j || process.cwd() + '/www/scripts/';
var css = argv.c || process.cwd() + '/www/css/';
var reload = argv.r;
if (reload) reload = typeof reload === 'boolean' ? "reload" : false;


var recipeFileName = recipe;
console.log(recipeFileName);

var filemon = require('filemonitor');
//don't forget to install inotify-tools for filemonitor!!!
require('colors');

var build = require('../src/html-builder.js').build;
var WebSocket = require('ws');
var websocket;

var monitoredDirs = [];

var isHtml = /.*\.html?$/;
var isMdown = /.*\.mdown?$/;
var isMarkdown = /.*\.markdown?$/;
var isMd = /.*\.md?$/;
var isJs = /.*\.js?$/;
var isCss = /.*\.css?$/;
    // function puts(error, stdout, stderr) { sys.puts(stdout); }
// log(datajs);

var lastEvent = {
    timestamp: '',
    filename: ''
};



function onFileEvent(ev) {
    // var filetype = ev.isDir ? "directory" : "file";
    console.log(ev.filename);
    // var i = ev.filename.lastIndexOf('/');
    // var dir = ev.filename.slice(0, i+1);
    // log(dir, ev.filename);
        
    if (ev.filename === recipeFileName ||
        // (target.indexOf(dir) !== -1 && (
        isMdown.test(ev.filename) ||
        isMarkdown.test(ev.filename) ||
        isMd.test(ev.filename) || 
        isHtml.test(ev.filename) ||
        isJs.test(ev.filename) ||
        isCss.test(ev.filename)
        // || true
       ) {
        // log(ev.timestamp);
        if (lastEvent.timestamp.toString() === ev.timestamp.toString() &&
            lastEvent.filename === ev.filename) return;
        lastEvent = ev;
        console.log('Modified>> '.green + ev.filename.yellow);
        // filemon.stop(function() {
                
        // });
            
        // build(function() { return websocket; });
        build(recipe).when(
            function() {
                // if (recipe.reload && recipe.reload.enable && getWebsocket) {
                if (websocket) {
                    console.log('Sending message to server to reload page');
                    websocket.send('reload');
                }
                // }
                // reload(recipe);
                
            },
            function(err){
                console.log(err);
                            
            });
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

// function addDirToMonitor(partial) {
//    if (partial.partialsDir && monitoredDirs.indexOf(partial.partialsDir) === -1)
//        monitoredDirs.push(partial.partialsDir);
// }

// function monitor(dataFileName) {
    
    // var i = dataFileName.lastIndexOf('/');
    // var dir = dataFileName.slice(0, i+1);
    // target.push(dir);
    // log(dir);
    // console.log(monitoredDirs);
    // var options = {
    //     target: monitoredDirs,
    //     recursive: true,
    //     listeners: {
    //         modify: onFileEvent
    //     }
    // };
    
    // console.log('Watching ' + monitoredDirs.toString());
    // filemon.watch(options); 
// } 
var toggle = 0;
var counter = 0;
var waiting = 'waiting';
function enableWebsocket() {
    console.log('Html-builder: Connecting to '.blue, url);
    var probe;
    var tried = 0;
    function connect() {
        if (tried === 0) {
            console.log('Trying to connect to ' + url);
        }
        else { process.stdout.write('\b\b\b\b\b\b\b' + waiting.slice(counter) + waiting.slice(0, counter));
               counter = (counter+1)%waiting.length;
               toggle = 1-toggle;
             }
        websocket = new WebSocket(url); 
        // When the connection is open, send some data to the server
        websocket.onopen = function () {
            websocketIsOpen = true;
            websocket.send('buildMonitor connec/ted');
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
            websocketIsOpen = false;
            console.log("Connection closed..");
            probe = setInterval(function() {
                connect();
            },1000);
        };
        tried++;
    }
    connect();
    probe = setInterval(function() {
        connect();
    },1000);
};

function init() {
    console.log('url ='.blue, url);
    if (url) enableWebsocket();

    monitoredDirs.push(scripts);

    monitoredDirs.push(dir);
    
    var options = {
        target: monitoredDirs,
        recursive: true,
        listeners: {
            modify: onFileEvent
        }
    };
    
    console.log('Watching ' + monitoredDirs.toString());
    filemon.watch(options); 
    console.log('going to build now...');
    build(recipe).when(
        function() {
            if (websocketIsOpen) {
                console.log('Sending message to server to reload page');
                websocket.send('reload');
            }
        },
        function(err) {
            console.log(err);
        }
    );
}
// var websocket = new WebSocket(url);

// websocket.on('open', function() {
//     websocket.send('buildMonitor connected');
// });

// websocket.on('error', function(err) {
//     console.log('Not able to connect to ' + url);
//     console.log("ERROR", err);
// });
init();




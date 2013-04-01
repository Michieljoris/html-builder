#!/usr/bin/env node

/*global exports:false require:false process:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:6 maxcomplexity:10 maxlen:190 devel:true*/
// var sys = require('sys');

var Plates = require('plates');
var util = require('util');
var fs = require('fs');
// var path = require('path');
var htmlFormatter = require('./html-formatter.js');
var md = require("node-markdown").Markdown;
var filemon = require('./filemonitor');
// var sys = require('sys');
// var exec = require('child_process').exec;
var argv = require('optimist').argv;


var log;

var defaultPartials = {
   _linkBlock: '', _scriptBlock: '' 
    ,script: '<script type="text/javascript" src="bla"></script>'
    ,link:'<link rel="stylesheet" type="text/css" href="">'
};
var partialsCollection = {};
var monitoredDirs;


function saveFile(name, str){
    fs.writeFileSync(
        // path.join(process.cwd(), name),
        name,
        str,
        'utf8');
}

function endsWith(str, trail) {
    return (str.substr(str.length-trail.length, str.length-1) === trail);
}


function trailWith(str, trail) {
    return str ? (str + (!endsWith(str, trail) ? trail : '')) : undefined;
}

function getPartial(partialsPath, name) {
    var partial, path; 
    // log('getting partial', name);
    if (name.indexOf('.') === -1) {
        partial = partialsCollection[name];   
        if (partial) return partial;
        name += '.html';
    }
    // log('searching for partial on disk');
    var isMarkdown = endsWith(name, '.md') || endsWith(name, '.markdown');
    if (!isMarkdown) name = trailWith(name, '.html');
    try {
        path = partialsPath + name;
        partial = fs.readFileSync(path, 'utf8');
        if (isMarkdown) partial = md(partial);
    } catch(e) {
        // console.log("Couldn't find partial " + partialsPath + name);
    }
    if (!partial) {
        log("Couldn't find partial " + partialsPath + name);
        partial = makeTag('div', {
            'class': 'row',
            style: 'margin-left: 0; padding-left:10px; border:solid grey 1px; height:40; width:100%;' 
            ,innerHtml: 'placeholder for ' + name
        });
    }
    return partial;   
}

function makeStyleBlock(args) {
    // console.log('Making style block\n', args);
    var path = trailWith(args.path, '/') || 'css/';
    var array = args.files;
    
    var map = Plates.Map();
    map.where('rel').is('stylesheet').use('data').as('href');
    var style = getPartial(args.partialsDir, 'link'); 
    var result = '';
    array.forEach(function(e) {
        if (e instanceof Object) {
            e.rel = 'stylesheet';
            e.type = 'text/css';
            if (e.indexOf('http') === 0)
                e.href = trailWith(e.name, '.css');
            else e.href = trailWith(path + e.name, '.css');
            delete e.name;
            result += makeTag('link', e);
        }
        else {
            e = trailWith(e, '.css');
            var data;
            if (e.indexOf('http') === 0)
                data = { data: e };
            else data = { data: path + e };
            result += Plates.bind(style, data, map);
        }
    });
    
    return result + '\n';   
}

function makeScriptBlock(args) {
    // console.log('Making script block\n', args);
    var path = trailWith(args.path, '/') || 'js/';

    var array = args.files;
    var map = Plates.Map();
    map.where('type').is('text/javascript').use('data').as('src');
    var script = getPartial(args.partialsDir, 'script'); 
    var result = '';
        array.forEach(function(e) {
            e = trailWith(e, '.js');
            var data = { data: path + e };
            result += Plates.bind(script, data, map);
        });
    return result + '\n';   
}


function makeTag(tag, attrs, unary) {
    var result = '<' + tag;
    attrs = attrs || {};
    var innerHtml = '';
    Object.keys(attrs).forEach(function(a) {
        if (a === 'innerHtml') innerHtml = attrs[a];
        else result += ' ' + a + '=' + '\'' + attrs[a] + '\'';
    });
    result += '>' + innerHtml;
    if (!unary) result += '</' + tag + '>';
    
    return result;   
}


function buildMenuTree(tree) {
    
   tree = tree || [];
    
    // var str = '<div class="ie-dropdown-fix" > <div id="navigation">' +
    //     '<ul id="nav" class="menu sf-menu">';
    var str = '';
    
    function makeLi(entry) {
        
        var href = entry.href || '#';
        var li = '<li><a href="' + href + '"' + 
            (entry.id ? (' id="' + entry.id + '"') : '') + 
            '>' +
            (entry.icon ? ('<i class="icon-' + entry.icon + '"></i>') : '') +
            entry.label + '</a>';
        if (entry.sub) {
                li += '<ul>';
            entry.sub.forEach(function(e){
                li += makeLi(e); 
            });
            li += '</ul>';
        }
        
        li +='</li>';
        return li;
    }
    
    tree.forEach(function(e){
        str += makeLi(e); 
    });
    

    // var end = '</ul></div></div><div class="clear"></div>';
    // str += end;   
    return str;
}

function addTo_Blocks(js, css) {
    partialsCollection._scriptBlock += makePartial('scriptBlock', { files: js});
    partialsCollection._linkBlock += makePartial('linkBlock', { files: css});
} 

function makeMenu(args) {
    var menus = {
        
        superfish: { 
            start: '<div class="ie-dropdown-fix" > <div id="navigation">' +
                '<ul id="nav" class="menu sf-menu">',
            end: '</ul></div></div><div class="clear"></div>',
            js : [
                'hoverIntent'
                ,'superfish'
                ,'startSuperfish'
            ],
            css : ['superfish'] }
        ,css: {
            start: '<div class="ie-dropdown-fix" > <div id="navigation">' +
                '<ul id="nav" class="menu">',
            end: '</ul></div></div><div class="clear"></div>',
            js: [],
            css: ['menu']
        }
    };
    var menu = menus[args.type];
    if (!menu) return '';
    addTo_Blocks(menu.js, menu.css);
    return menu.start + buildMenuTree(args.tree) + menu.end;
    
}

function makeSequenceSlider(slides) {
    var js = [
            'sequence.jquery-min'
            ,'startSequence'
    ];
    var css = ['slidein-seqtheme'];
    addTo_Blocks(js, css);
    return '';
    //TODO
}

function makeFlexSlider(slides) {
    var js = [
        'jquery.flexslider-min'
        // 'startFlex'
    ];
    var css = ['flexslider'];
    addTo_Blocks(js, css);
    
    function makeSlide(s) {
        return '<li><img src=' + s.url + 
            '><div class="slide-caption"><h3>' + 
            s.title + '</h3> </div> </li>';
    }
    // var slides = args.slides; 
    var str ='<div class="flexslider"><ul class="slides">';
    slides.forEach(function(s) {
        str += makeSlide(s);   
    });
    str += '</ul> </div>';
    return str;
}

function makeCameraSlider(slides) {
    var js = [
        'jquery.mobile.customized.min'
        ,'jquery.easing.1.3'
        ,'camera.min'
        ,'startCamera'
    ];
    var css = ['camera'];
    addTo_Blocks(js, css);
    
    function makeSlide(s) {
        return '<div data-src=' + s.url +
            '><div class="camera_caption fadeFromLeft"><h4>' +
            s.title + '</h4>' + s.subtitle + '</div></div>'; 
    }
    // var slides = args.slides; 
    var str= '<div id="camera" class="camera_wrap">';
    slides.forEach(function(s) {
        str += makeSlide(s);   
    });
    str+='</div> </div>';
    return str;
}


function makeSlideShow(args) {
    var makers = {
        camera: makeCameraSlider,
        flex: makeFlexSlider,
        sequence: makeSequenceSlider
    };
    if (!makers[args.type]) return '';
    return makers[args.type](args.slides);
}

function render(args) {
    var partialsDir = args.partialsDir;
    
    var template = getPartial(partialsDir, args.src);
        
    args.mapping = args.mapping || [];
    Object.keys(args.mapping).forEach(function(tagId) {
        var partialIds = args.mapping[tagId];
        partialIds = util.isArray(partialIds) ? partialIds : [partialIds];
        
        var html = '';
        partialIds.forEach(function(partialId) {
            html += getPartial(partialsDir, partialId);
        });
        var selector = {};
        selector[tagId + args.tagIdPostfix] = html;
        template = Plates.bind(template, selector); 
    });
   
    if (args.prettyPrintHtml) {
        template = htmlFormatter.format(template,{
            indentSize: 4,
            maxLineLength: 10,
            indent: 2
        });
    }
    if (args.out) {
        saveFile(args.baseDir + args.out, template);   
        log('Created ' + args.out);
    }
    // log(template);
    log('Processed template ' + args.src);
    log('------------------------------');
    return template;
}

function addProperties(o1,o2) {
    var newObject = {};
    o1 = o1 || {};
    o2 = o2 || {};
    Object.keys(o1).forEach(function(k) {
        newObject[k] = o1[k];
    });
    Object.keys(o2).forEach(function(k) {
        newObject[k] = o2[k];
    });
    return newObject;
} 

function makeUnaryTags(args) {
    var tag = args.tagType;
    var attrCollection = args.tags;
    var result = '';
    attrCollection = attrCollection || [];
    attrCollection.forEach(function(attrs) {
        result += makeTag(tag, attrs, true);
    });
    return  result + '\n';   
}

function addDirToMonitor(partial) {
   if (partial.partialsDir && monitoredDirs.indexOf(partial.partialsDir) === -1)
       monitoredDirs.push(partial.partialsDir);
}

function processPartials(partials) {
    partialsCollection = addProperties(defaultPartials, partials.ids);
    Object.keys(partials).forEach(function(k) {
        addDirToMonitor(partials[k]);
        partials[k] = partials[k] || [];
        partials[k] = util.isArray(partials[k]) ? partials[k] : [partials[k]];
        partials[k].forEach(function(d) {
            var partial = makePartial(k, d);
            if (d.id) partialsCollection[d.id] = partial;
        });
    });
    // log(util.inspect(partialsCollection, { colors: true }));
}



function evalFile(fileName) {
    var file;
    try { file = fs.readFileSync(fileName, 'utf8');
          // console.log(file);
          eval(file);
          return exports;
        } catch (e) {
            console.log('Error reading data file: ', e);
            return undefined;
        }
} 

function monitor(dataFileName, target) {
    var isHtml = /.*\.html?$/;
    var isMdown = /.*\.mdown?$/;
    var isMarkdown = /.*\.markdown?$/;
    var isMd = /.*\.md?$/;
    // function puts(error, stdout, stderr) { sys.puts(stdout); }
    // log(datajs);

    var lastEvent = {
        timestamp: '',
        filename: ''
    };
    
    var onFileEvent = function (ev) {
        // var filetype = ev.isDir ? "directory" : "file";
        // log(ev.filename);
        var i = ev.filename.lastIndexOf('/');
        var dir = ev.filename.slice(0, i+1);
        // log(dir, ev.filename);
        if (ev.filename === dataFileName ||
            (target.indexOf(dir) !== -1 && (
                isMdown.test(ev.filename) ||
                isMarkdown.test(ev.filename) ||
               isMd.test(ev.filename) || 
                    isHtml.test(ev.filename)))) {
            // log(ev.timestamp);
            if (lastEvent.timestamp.toString() === ev.timestamp.toString() &&
                lastEvent.filename === ev.filename) return;
            lastEvent = ev;
            log('Modified>> ' + ev.filename);
            filemon.stop(function() {
                build();
                
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
    var i = dataFileName.lastIndexOf('/');
    var dir = dataFileName.slice(0, i+1);
    target.push(dir);
    log(dir);
    var options = {
        target: target,
        // recursive: true,
        listeners: {
            modify: onFileEvent
        }
    };
    
    log('Watching ' + target + ' and ' + dataFileName);
    filemon.watch(options); 
} 


var builders = {
    metaBlock: { f: makeUnaryTags, defArgs: { tagType: 'meta'}}
    ,linkBlock: { f: makeStyleBlock }
    ,scriptBlock: { f: makeScriptBlock }
    ,slideShow:  { f: makeSlideShow }
    ,menu: { f: makeMenu }
    ,template: { f: render }
};

function makePartial(name, args) {
    var maker = builders[name];
    if (!maker) return '';
    args = addProperties(maker.defArgs, args);
    return maker.f(args);
}

var testing = true;
function build() {
    // var dataFileName = (argv._ && argv._[0]) || argv.file || '/home/michieljoris/www/firstdoor/data.js';
    var dataFileName = (argv._ && argv._[0]) || argv.file || process.cwd() + '/data.js';
    
    // try {
    var buildData = evalFile(dataFileName);
    if (!buildData) throw Error('buildData is undefined!!');
    
    buildData.baseDir = trailWith(buildData.baseDir || process.cwd(), '/');
    buildData.partialsDir = trailWith( buildData.partialsDir || 'partials', '/');
    buildData.tagIdPostfix = buildData.tagIdPostfix || '__';
        
    log = !buildData.verbose || !testing ?  function () {}: function() {
        console.log.apply(console, arguments); };
    log('Cwd: ' + process.cwd());
    log('Base dir: ' + buildData.baseDir);
    
    var partialsDir = buildData.baseDir + buildData.partialsDir;
    builders.template.defArgs = {
        baseDir: buildData.baseDir,
        partialsDir: partialsDir,
        tagIdPostfix: buildData.tagIdPostfix,
        prettyPrintHtml: buildData.prettyPrintHtml
    };
    
    builders.linkBlock.defArgs = {
        partialsDir: partialsDir,
        css: 'css/'
    };
    
    builders.scriptBlock.defArgs = {
        partialsDir: partialsDir,
        js: 'js'
    };
    
    monitoredDirs = [];
    monitoredDirs.push(partialsDir);
    processPartials(buildData.partials || {});
    
    // render();
    log('Finished rendering');
        
    if (buildData.monitor) monitor(dataFileName, monitoredDirs);
    // } catch (e) {
    //     console.log(dataFileName + ' is invalid, or doesn\'t exist!!\n', e);
    // }

}

if (argv.h || argv.help) {
    console.log([
        "usage: html-builder [pathToData.js]"
    ].join('\n'));
    process.exit();
}

build();

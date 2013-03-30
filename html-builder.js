#!/usr/bin/env node

/*global exports:false require:false process:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:6 maxcomplexity:10 maxlen:190 devel:true*/
// var sys = require('sys');

var Plates = require('plates');
var fs = require('fs');
// var path = require('path');
var htmlFormatter = require('./html-formatter.js');
var md = require("node-markdown").Markdown;
var filemon = require('filemonitor');
// var sys = require('sys');
// var exec = require('child_process').exec;
var argv = require('optimist').argv;


var cachedPartials = {};
var buildData;
var log;



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


function getPartial(name) {
    var partial, path; 
    var isMarkdown = endsWith(name, '.md') || endsWith(name, '.markdown');
    // if (cachedPartials[name]) return cachedPartials[name];
    if (!isMarkdown) name = trailWith(name, '.html');
    try {
        path = buildData.basePath + buildData.partialsPath + name;
        partial = fs.readFileSync(path, 'utf8');
    } catch(e) {
        console.log("Couldn't find partial " + buildData.partialsPath + name);
        partial = makeTag('div', {
            'class': 'row',
            style: 'margin-left: 0; padding-left:10px; border:solid grey 1px; height:40; width:100%;' 
            ,innerHtml: 'placeholder for ' + name
        });
    }
    if (isMarkdown) partial = md(partial);
    cachedPartials[name] = partial;
    return partial;   
}

function makeStyleBlock(path, array) {
    var map = Plates.Map();
    map.where('rel').is('stylesheet').use('data').as('href');
    var style = getPartial('style'); 
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

function makeScriptBlock(path, array) {
    var map = Plates.Map();
    map.where('type').is('text/javascript').use('data').as('src');
    var script = getPartial('script'); 
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

function makeUnaryTags(tag, attrCollection) {
    var result = '';
    attrCollection = attrCollection || [];
    attrCollection.forEach(function(attrs) {
        result += makeTag(tag, attrs, true);
    });
    return  result + '\n';   
}


function wrap(string, tag) {
    var partial = getPartial(tag);
    
    var data = {};
    data[tag] = string;
    return Plates.bind(partial, data); 
}


function buildMenu(menu) {
    
    menu = menu || [];
    
    var str = '<div class="ie-dropdown-fix" > <div id="navigation">' +
        '<ul id="nav" class="menu sf-menu">';
    
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
    
    menu.forEach(function(e){
        str += makeLi(e); 
    });
    

    var end = '</ul></div></div><div class="clear"></div>';
    str += end;   
    return str;
}


function makeSequenceSlider(data) {
    var js = [
            'sequence.jquery-min'
            ,'startSequence'
    ];
    var css = ['slidein-seqtheme'];
    data.scripts = data.scripts.concat(js);
    data.styles = data.styles.concat(css);
    //TODO
}

function makeFlexSlider(data) {
    var js = [
        'jquery.flexslider-min',
        'startFlex'
    ];
    var css = ['flexslider'];
    data.scripts = data.scripts.concat(js);
    data.styles = data.styles.concat(css);
    function makeSlide(s) {
        return '<li><img src=' + s.url + 
            '><div class="slide-caption"><h3>' + 
            s.title + '</h3> </div> </li>';
    }
        var slides = data.slides; 
    var str ='<div class="flexslider"><ul class="slides">';
    slides.forEach(function(s) {
        str += makeSlide(s);   
    });
    str += '</ul> </div>';
    return str;
}

function makeCameraSlider(data) {
    var js = [
        'jquery.mobile.customized.min'
        ,'jquery.easing.1.3'
        ,'camera.min'
        ,'startCamera'
    ];
    var css = ['camera'];
    data.scripts = data.scripts.concat(js);
    data.styles = data.styles.concat(css);
    
    function makeSlide(s) {
        return '<div data-src=' + s.url +
            '><div class="camera_caption fadeFromLeft"><h4>' +
            s.title + '</h4>' + s.subtitle + '</div></div>'; 
    }
    var slides = data.slides; 
    var str= '<div id="camera" class="camera_wrap">';
    slides.forEach(function(s) {
        str += makeSlide(s);   
    });
    str+='</div> </div>';
    return str;
}

var makeSlideShow = {
    camera: makeCameraSlider,
    flex: makeFlexSlider,
    sequence: makeSequenceSlider
};

function render() {
    var paths = buildData.paths || {};
    paths.js = trailWith(paths.js, '/') || 'js/';
    paths.css = trailWith(paths.css, '/') || 'css/';
    var slideShowHtml = '';
    if (buildData.slideShow)
        slideShowHtml = makeSlideShow[buildData.slideShow](buildData);

    buildData.styles = buildData.styles || [];
    buildData.scripts = buildData.scripts || [];
    
    // var styleSwitcherHtml = '';
    // var styleSwitcherLink = '';
    // if (buildData.styleSwitcher) {
    //     styleSwitcherHtml = getPartial('styles-switcher');
    //     buildData.scripts.push('styles-switcher');
    //     buildData.styles.push('styles-switcher');
    //     // options.styles.push({name: 'ribbons', id: 'ribbons'});
    // }
    
    var metaTags = makeUnaryTags('meta', buildData.metaTags);
    var styleBlock = makeStyleBlock(paths.css, buildData.styles);
    var scriptBlock = makeScriptBlock(paths.js, buildData.scripts);
    var title = '<title>' + buildData.title + '</title>';
    var head = wrap(title + metaTags + styleBlock + scriptBlock, 'head');

    var layoutIdPrefix = buildData.layoutIdPrefix || 'layout';
    var layout = buildData.layoutPartial || 'layout';
    layout = getPartial(layout);
    
    var partials = buildData.partials || {};
    
    Object.keys(partials).forEach(function(p) {
        var html = getPartial(partials[p]);
        var selector = {};
        selector[layoutIdPrefix + '-' +  p] = html;
        layout = Plates.bind(layout, selector); 
    });
    var menuHtml = buildMenu(buildData.menu);
    var menu = { "layout-menu": menuHtml };
    layout = Plates.bind(layout, menu); 
    
    var slideShow = { "layout-slideShow": slideShowHtml };
    layout = Plates.bind(layout, slideShow); 
    
    // var logoHtml = getPartial('logo');
    // var logo = { "partial-logo": logoHtml };
    // layout = Plates.bind(layout, logo); 
    // layout += styleSwitcherHtml;
    
    var body = wrap(layout, 'body');
    var output = '<!doctype html>\n' +
        '<!--[if IE 7 ]><html ng-app class="ie ie7" lang="en"><![endif]-->\n' +
        '<!--[if IE 8 ]><html ng-app class="ie ie8" lang="en"><![endif]-->\n' +
        '<!--[if (gte IE 9)|!(IE)]><!--><html ng-app lang="en"><!--<![endif]-->\n\n' + 
        head + body +
        '\n</html>';
    
    if (buildData.prettyPrintHtml) {
        output = htmlFormatter.format(output,{
            indentSize: 4,
            maxLineLength: 10,
            indent: 2
        });
    }

    saveFile(buildData.basePath + buildData.out, output);
    log('Created ' + buildData.out);

    
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

function monitor(buildjsfile, target) {
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
        if (ev.filename === buildjsfile ||
            (dir === target && (
                isMdown.test(ev.filename) ||
                isMarkdown.test(ev.filename) ||
               isMd.test(ev.filename) || 
            isHtml.test(ev.filename)))) {
            // log(ev.timestamp);
            if (lastEvent.timestamp.toString() === ev.timestamp.toString() &&
                lastEvent.filename === ev.filename) return;
            lastEvent = ev;
            log('Modified>> ' + ev.filename);
            // log('Building ' + buildData.out);
            // exec("lispy -r " + ev.filename, puts);
            buildData = evalFile(file);
            buildData.partialsPath = trailWith( buildData.partialsPath, '/');
            // log(buildData.title);
            
            render();
            // log("Event " + ev.eventId + " was captured for " +
            //             filetype + " " + ev.filename + " on time: " + ev.timestamp.toString());
            // }
        }
    };
    var i = buildjsfile.lastIndexOf('/');
    var dir = buildjsfile.slice(0, i+1);
    log(dir);
    var options = {
        target: [dir, target],
        // recursive: true,
        listeners: {
            modify: onFileEvent
        }
    };
    
    log('Watching ' + target + ' and ' + buildjsfile);
    filemon.watch(options);
} 

if (argv.h || argv.help) {
    console.log([
        "usage: html-builder [pathToData.jsFile]"
    ].join('\n'));
    process.exit();
}

var file = (argv._ && argv._[0]) || argv.file || process.cwd() + '/data.js';
    
try {
    buildData = evalFile(file);
    buildData.partialsPath = trailWith( buildData.partialsPath, '/');
    
    log = !buildData.verbose ?  function () {}: function() {
        console.log.apply(console, arguments); };
    log('Cwd: ' + process.cwd());
    render();
    if (buildData.monitor) monitor(file, buildData.basePath + buildData.partialsPath);
} catch (e) {
    console.log(file + ' doesn\'t exist!!');
}



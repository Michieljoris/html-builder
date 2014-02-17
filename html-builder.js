/*global exports:false require:false process:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:6 maxcomplexity:10 maxlen:190 devel:true*/
// var sys = require('sys');

var Plates = require('plates');
var util = require('util');
var fs = require('fs');
var htmlFormatter = require('./html-formatter.js');
var md = require("node-markdown").Markdown;
// var sys = require('sys');
// var exec = require('child_process').exec;
var colors = require('colors');
var Path = require('path');
var crypto = require('crypto');

var log;

var defaultPartials = {
   _linkBlock: '', _scriptBlock: '' 
    ,script: '<script type="text/javascript" src="bla"></script>'
    ,link:'<link rel="stylesheet" type="text/css" href="">'
};
var partialsCollection = {};
// var monitoredDirs;


var calcStamp;

function getCalcStamp(settings) {
    return settings.method === 'mtime'  ?
        function (pathName) { 
            return fs.statSync(pathName).mtime.getTime(); }
    : function (file) { 
        var sum = crypto.createHash(settings.method);
        sum.update(fs.readFileSync(file));
        return sum.digest('hex').slice(0, settings.length);
    };
}

function cachify(prefix, pathName, exclude) {
    exclude = exclude || [];
    var stamp;
    var ext = Path.extname(pathName).slice(1);
    if (~exclude.indexOf(ext)) return pathName;
    try {
	stamp = calcStamp(pathName);
	
    } catch(e) { console.log('Failed to stamp '.red + pathName.green + ' err: '.red + e);
		 return pathName;
	       }
    return Path.join(prefix + stamp, pathName);
}


var extraJs = {}, extraCss = {};
function addResources(id, js, css) {
    extraJs[id] = js;
    extraCss[id] = css;
}

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
    var partial, path, partialName; 
    // log('getting partial', name);
    if (name.indexOf('.') === -1) {
        partial = partialsCollection[name];   
        if (partial) return partial;
    }
    partialName = name;
    // log('searching for partial on disk');
    var isMarkdown = endsWith(name, '.md') || endsWith(name, '.markdown');
    var isJs = endsWith(name, '.js');
    if (!isJs && !isMarkdown) name = trailWith(name, '.html');
    try {
        path = partialsPath + name;
        partial = fs.readFileSync(path, 'utf8');
        if (isMarkdown) partial = md(partial);
        // console.log(partial);
        //bloody IE panics and goes into quirk mode if there's anything before the doctype html tag!!!
        //so make sure for IE compatibility to have as the basic page's first 15 characters:<doctype html> 
        if (partial.slice(0,15).toLowerCase() !== '<!doctype html>')
            partial =  "\n<!--partial:" +  name +  "-->\n" + partial;
        // console.log('got partial ' + name + ' from disk');
    } catch(e) {
        // console.log("Couldn't find partial " + partialsPath + name);
    }
    if (!partial) {
        log(partialName.red + " has not been defined nor found in " +
            partialsPath.red + ' as an html file.');
        partial = makeTag('div', {
            'class': 'row',
            style: 'margin-left: 0; padding-left:10px; border:solid grey 1px; height:40; width:100%;' 
            ,innerHtml: 'placeholder for ' + partialName
        });
    }
    return partial;   
}

function makeStyleBlock(args) {
    // console.log('Making style block\n', args);
    
    var path = (typeof args.path === 'undefined') ? 'css' : args.path;
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
            else data = { data: Path.join(path , e) };
            result += Plates.bind(style, data, map);
        }
    });
    
    return result + '\n';   
}

function makeScriptBlock(args) {
    // console.log('Making script block\n', args);
    var path = (typeof args.path === 'undefined') ? 'js' : args.path;
    var array = args.files;
    var map = Plates.Map();
    map.where('type').is('text/javascript').use('data').as('src');
    var script = getPartial(args.partialsDir, 'script'); 
    var result = '';
        array.forEach(function(e) {
            e = trailWith(e, '.js');
            var data = { data: Path.join(path, e) };
            result += Plates.bind(script, data, map);
        });
    // log(result);
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

function makeRouterMapping(route, partial, cntl) {
    if (partial[0] !== '/') partial = '/' + partial;
    return ',["' + route + '", "' + partial + '"' +
        (cntl ? ', ' + cntl : '')  +
        ']\n'; 
}

function makeRouterBlock(routes) {
    var routerMapping = '';
    // log('isarray', util.isArray(routes));
    if (routes && util.isArray(routes)) {
        routes.forEach(function(r) {
            routerMapping += makeRouterMapping(r[0], r[1], r[2]) ;
        }); 
        if (routerMapping.length && routerMapping[0] === ',')
            routerMapping = routerMapping.slice(1);
        // log(routerMapping);
    }
    return routerMapping;
}


function buildMenuTree(tree) {
    tree = tree || [];
    
    // var str = '<div class="ie-dropdown-fix" > <div id="navigation">' +
    //     '<ul id="nav" class="menu sf-menu">';
    var str = '';
    function removeSlashes(str) {
        if (str[0] === '/') str = str.slice(1);
        if (str[str.length-1] === '/') str = str.slice(0, str.length-1);
        return str;
    }
    
    function makeLi(entry) {
        
        var href = entry.href ||
            (entry.route ? '#!/' + removeSlashes(entry.route) : undefined) ||
            '#';
        
        var li = '<li><a href="' + href + '"' + 
            (entry.scroll ? (' class="scroll"') : '') +
            (entry.id ? (' id="' + entry.id + '"') : (' id="' + removeSlashes(entry.route + '"'))) + 
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
    // var length = routerMapping.lenght;
    // if (length && routerMapping[length-1] === ',')
    //     routerMapping = routerMapping.slice(0, length-1);
    // var end = '</ul></div></div><div class="clear"></div>';
    // str += end;   
    return str;
}

// function addTo_Blocks(js, css) {
//     log('-----', partialsCollection._scriptBlock);
//     partialsCollection._scriptBlock += makePartial('scriptBlock', { files: js});
//     log('-----', partialsCollection._scriptBlock);
//     partialsCollection._linkBlock += makePartial('linkBlock', { files: css});
// } 

addResources('cssmenu',[] , ['menu.css']);
addResources('superfish', ['hoverIntent.js', 'superfish.js', 'startSuperfish.js']);
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
    // addTo_Blocks(menu.js, menu.css);
    return menu.start + buildMenuTree(args.tree) + menu.end;
    
}

addResources('sequence-slider',
             ['sequence.jquery-min.js' ,'startSequence.js'],
             ['slidein-seqtheme.css']);
function makeSequenceSlider(slides) {
    // var js = [
    //         'sequence.jquery-min'
    //         ,'startSequence'
    // ];
    // var css = ['slidein-seqtheme'];
    // addTo_Blocks(js, css);
    return '';
    //TODO
}

addResources('flex-slider', ['jquery.easing.1.3.js'
                             ,'jquery.flexslider-min.js'],
             ['flexslider.css']);
function makeFlexSlider(slides) {
    // var js = [
    //     'jquery.easing.1.3'
    //     ,'jquery.flexslider-min'
    //     // 'startFlex'
    // ];
    // var css = ['flexslider'];
    // addTo_Blocks(js, css);
    
    function makeSlide(s) {
        return '<li><img src="' + s.url + 
            '"><div class="slide-caption"><h3>' + 
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

addResources('camera-slider', [
    // 'jquery.mobile.customized.min'
    // ,'startCamera'
    'jquery.easing.1.3.js' ,'camera.min.js'],
             ['camera.css']);

function makeCameraSlider(slides) {
    // var js = [
    //     // 'jquery.mobile.customized.min'
    //     'jquery.easing.1.3'
    //     ,'camera.min'
    //     // ,'startCamera'
    // ];
    // var css = ['camera'];
    // addTo_Blocks(js, css);
    
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


addResources('showhide', ['showhide.js'], ['showhide.css']);
function makeShowHide(args) {
    // if (uid === 1) {
    //     var js = [
    //         'showhide'
    //     ];
    //     var css = ['showhide'];
    //     addTo_Blocks(js, css);
    // }
    
    var wrapper = getPartial(args.partialsDir, 'html/showhide');
    var wrappee = getPartial(args.partialsDir, args.showhide);
    wrapper = wrapper.replace(/uniqueid/g, 'showhide' + uid++);
    wrapper = wrapper.replace('inserthere', wrappee);
    return wrapper;
}

function render(args) {
    if (args.showhide) {
        return makeShowHide(args);
    }
    var partialsDir = args.partialsDir;
    if (!args.src) {
        log("Can't render partial. No source defined".red);
        log(args);
        return '';
    }
    
    // console.log('getting partial for ', args.src);
    var template = getPartial(partialsDir, args.src);
    
    args.mapping = args.mapping || [];
    
    var selector = {};
    Object.keys(args.mapping).forEach(function(tagId) {
        var partialIds = args.mapping[tagId];
        partialIds = util.isArray(partialIds) ? partialIds : [partialIds];
        
        var html = '';
        partialIds.forEach(function(partialId) {
            html += getPartial(partialsDir, partialId);
        });
        selector[tagId + args.tagIdPostfix] = html;
    });
    
    template = Plates.bind(template, selector); 
   
    if (args.prettyPrintHtml) {
        template = htmlFormatter.format(template,{
            indentSize: 4,
            maxLineLength: 10,
            indent: 2
        });
    }
    var str = args.src.green;
    if (args.out) {
        saveFile(args.root + args.pathOut + args.out, template);   
        str+= ' >> ' + args.out.blue;
        // log('>>' + args.out);
    }
    log(str);
    // log(template);
    
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

function processPartials(partials) {
    uid = 1;
    partialsCollection = addProperties(defaultPartials, partials.ids);
    Object.keys(partials).forEach(function(k) {
        // addDirToMonitor(partials[k]);
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
            console.log('Error reading data file: '.red, e);
            return undefined;
        }
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
function build(dataFileName) {
    if (!dataFileName)
        dataFileName = process.cwd() + '/build/recipe.js';
    var buildData = evalFile(dataFileName);
    var partialsDir;
    if (!buildData) {
        buildData = {
            verbose: true
        };
    }
    var paths = buildData.paths = buildData.paths || {};
    paths.www = paths.www || 'www';
    paths.root = trailWith(paths.root || process.cwd(), '/');
    paths.partials = trailWith( paths.partials || 'build', '/');
    // paths.monitor = trailWith( paths.monitor || 'build', '/');
    paths.out = Path.join(paths.www , trailWith( paths.out || 'built', '/'));
    paths.js = Path.join(paths.www , trailWith( paths.js || 'js', '/'));
    
    log = !buildData.verbose || !testing ?  function () {}: function() {
        console.log.apply(console, arguments); };
    
    
    buildData.tagIdPostfix = buildData.tagIdPostfix || '--';
        
    log('Cwd: ' + process.cwd());
    log('Root dir: ' + buildData.paths.root);
    
    partialsDir = buildData.paths.root + buildData.paths.partials;
    builders.template.defArgs = {
        root: paths.root,
        partialsDir: partialsDir,
        tagIdPostfix: buildData.tagIdPostfix,
        prettyPrintHtml: buildData.prettyPrintHtml,
        pathOut: paths.out
    };
    
    builders.linkBlock.defArgs = {
        partialsDir: partialsDir,
        css: 'css/'
    };
    
    builders.scriptBlock.defArgs = {
        partialsDir: partialsDir,
        js: 'js'
    };
    
    if (buildData.routes) {
        var routerJsString = getPartial(partialsDir, 'js/router.js');
        var routes  = makeRouterBlock(buildData.routes);
        // routes = '/*' + routes + '*/';
        routerJsString = routerJsString.replace(/inserthere/, routes);
        saveFile(paths.root + trailWith(paths.js, '/') + 'router.js', routerJsString);
    }
    
    function concat(blocks, ext) {
        if (blocks) {
            blocks = Array.isArray(blocks) ? blocks : [blocks];
            blocks = blocks.map(function(block) {
                block.files = Array.isArray(block.files) ? block.files : [block.files];
                var data =  block.files
                    .map(function(f) {
                        return Path.join(paths.root , paths.www, block.path + trailWith(f, ext));
                    })
                    .filter(function(f) {
                        if (fs.existsSync(f)) return true;
                        else log('Warning: '.red + 'Not found: ' + f.yellow);
                        return false;
                    })
                    .map(function(f) {
                        var data = fs.readFileSync(f);
                        // return ('//*' + f + '*//\n' + data.toString().slice(0,30));
                        return ('//*' + f + '*//\n' + data.toString());
                    }).join('\n;\n');
                var fileName = trailWith(block.id, ext);
                fs.writeFileSync(Path.join(paths.root, paths.www, fileName), data);
                return { id: block.id, files: [fileName], path: '' };
            });
        }
        return blocks;
    } 
    
    var firstScriptBlock = Array.isArray(buildData.partials.scriptBlock) ?
        buildData.partials.scriptBlock[0] : 
        buildData.partials.scriptBlock;
    var firstLinkBlock = Array.isArray(buildData.partials.linkBlock) ?
        buildData.partials.linkBlock[0] : 
        buildData.partials.linkBlock;
    Object.keys(extraJs).forEach(function(key) {
        if (~buildData.extras.indexOf(key)) {
            if (extraJs[key])
                firstScriptBlock.files = firstScriptBlock.files.concat(extraJs[key]); 
            if (extraCss[key])
                firstLinkBlock.files = firstScriptBlock.files.concat(extraCss[key]); 
        }
    });

    if (buildData.concatenate) {
        buildData.partials.scriptBlock = concat(buildData.partials.scriptBlock, '.js');
        buildData.partials.linkBlock = concat(buildData.partials.linkBlock, '.css');
    }
    if (buildData.cachify) {
        buildData.cachify = typeof buildData.cachify === 'boolean' ?
            {   exclude: [],
                method: 'sha1',
                length: 10,
                prefix: '_'
            } : buildData.cachify;
        calcStamp = getCalcStamp(buildData.stamp); 
    }
    else cachify = function(pathName) { return pathName; };
    
    // log(util.inspect(buildData, { colors: true }));
    processPartials(buildData.partials || {});
    
    log('Finished rendering');
}

// if (argv.h || argv.help) {
//     console.log([
//         "usage: html-builder [pathToData.js]"
//     ].join('\n'));
//     process.exit();
// }

exports.build = build;

build('./recipe.js');


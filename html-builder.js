/*global exports:false process:false require:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:6 maxcomplexity:10 maxlen:190 devel:true*/
// var sys = require('sys');

var Plates = require('plates');
var fs = require('fs');
var path = require('path');
var htmlFormatter = require('./html-formatter.js');

function render(options) {
    function trailWith(str, trail) {
        return str ? (str +
                      (str.substr(str.length-trail.length, str.length-1) !==
                       trail ? trail : '')) : undefined;
    }
    
    var paths = options.paths || {};
    paths.js = trailWith(paths.js, '/') || 'js/';
    paths.css = trailWith(paths.css, '/') || 'css/';
    // paths.font = trailWithSlash(paths.font) || 'font/';
    

    function saveFile(name, str){
        fs.writeFileSync(
            path.join(process.cwd(), name),
            str,
            'utf8');
    }

    var cachedPartials = {};
    function getPartial(name) {
    
        var partial; 
        if (cachedPartials[name]) return cachedPartials[name];
        try {
            partial = fs.readFileSync(
                path.join(process.cwd(), 'partials/' + name + '.html'),
                'utf8');
        } catch(e) {
            partial = makeTag(name);
        }
        cachedPartials[name] = partial;
        return partial;
    }

    function makeStyleBlock(path, array) {
        if (!array) array = [];
        var map = Plates.Map();
        map.where('rel').is('stylesheet').use('data').as('href');
        var script = getPartial('style'); 
        var result = '';
        array.forEach(function(e) {
            e = trailWith(e, '.css');
            var data = { data: path + e };
            result += Plates.bind(script, data, map);
        });
        
        return result;   
    }

    function makeScriptBlock(array) {
        if (!array) array = [];
        var map = Plates.Map();
        map.where('type').is('text/javascript').use('data').as('src');
        var script = getPartial('script'); 
        var result = '';
        array.forEach(function(e) {
            e = trailWith(e, '.js');
            var data = { data: paths.js + e };
            result += Plates.bind(script, data, map);
        });
        return result;   
    }


    function makeTag(tag, attrs, unary) {
        var result = '<' + tag;
        attrs = attrs || {};
        Object.keys(attrs).forEach(function(a) {
            result += ' ' + a + '=' + '\'' + attrs[a] + '\'';
        });
        result += '>';
        if (!unary) result += '</' + tag + '>';
        return result;
    }

    function makeUnaryTags(tag, attrCollection) {
        var result = '';
        attrCollection = attrCollection || [];
        attrCollection.forEach(function(attrs) {
            result += makeTag(tag, attrs, true);
        });
        return result;
    }

    var scriptBlock = makeScriptBlock(options.scripts);
    var styleBlock = makeStyleBlock(paths.css, options.styles);
    // var fontBlock = makeStyleBlock(paths.font, options.fonts);
    var metaTags = makeUnaryTags('meta', options.metaTags);

    function wrap(string, tag) {
        var partial = getPartial(tag);
    
        var data = {};
        data[tag] = string;
        return Plates.bind(partial, data); 
    }

    
    function buildMenu(menu) {
    
        menu = menu || [];
    
        var str = '<div class="ie-dropdown-fix" > <div id="navigation">' +
            '<div class="left-corner"></div> <div class="right-corner">' +
            '</div> <ul id="nav" class="menu">';
    
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
        
            li +='</li';
            return li;
        }
        
        menu.forEach(function(e){
            str += makeLi(e); 
        });
    

        var end = '</ul></diwv><div class="clear"></div>  </div></div>';
        str += end;   
        return str;
    }

    var title = '<title>' + options.title + '</title>';

    var head = wrap(title + metaTags + styleBlock + scriptBlock, 'head');
    
    var navigation = buildMenu(options.menu);
    var layout = getPartial('layout');
    var menu = { "layout-navigation": navigation };
    var body = Plates.bind(layout, menu); 
        
    var output = head + body;

    var result = htmlFormatter.format(output,{
        indentSize: 4,
        maxLineLength: 10,
        indent: 2
    });

    result = '<!doctype html>\n' +
        '<!--[if IE 7 ]><html ng-app class="ie ie7" lang="en"><![endif]-->\n' +
        '<!--[if IE 8 ]><html ng-app class="ie ie8" lang="en"><![endif]-->\n' +
        '<!--[if (gte IE 9)|!(IE)]><!--><html ng-app lang="en"><!--<![endif]-->\n\n' + 
        result +
        '\n</html>';
    // console.log(result);
    saveFile('../index.html', result);
    console.log('Created index.html');

 
}

exports.render = render;

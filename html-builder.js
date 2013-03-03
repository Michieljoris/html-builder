/*global exports:false process:false require:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:6 maxcomplexity:10 maxlen:190 devel:true*/
// var sys = require('sys');

var Plates = require('plates');
var fs = require('fs');
var path = require('path');
var htmlFormatter = require('./html-formatter.js');
var cachedPartials = {};

function saveFile(name, str){
    fs.writeFileSync(
        // path.join(process.cwd(), name),
        name,
        str,
        'utf8');
}

function trailWith(str, trail) {
    return str ? (str +
                  (str.substr(str.length-trail.length, str.length-1) !==
                   trail ? trail : '')) : undefined;
}
    

function getPartial(name) {
    var partial; 
    if (cachedPartials[name]) return cachedPartials[name];
    try {
        partial = fs.readFileSync(
            path.join(options.path, options.partialsPath + name + '.html'),
            'utf8');
    } catch(e) {
        console.log("Couldn't find partial " + name);
        partial = makeTag('div', {
            'class': 'row',
            style: 'border:solid grey 1px; height:40; width:100%;' 
            ,innerHtml: 'placeholder for ' + name
        });
    }
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
            e.href = trailWith(path + e.name, '.css');
            delete e.name;
            result += makeTag('link', e);
        }
        else {
            e = trailWith(e, '.css');
            var data = { data: path + e };
            result += Plates.bind(style, data, map);
        }
    });
    
    return result;   
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
    return result;   
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
    return result;
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
function render(options) {
    var paths = options.paths || {};
    paths.js = trailWith(paths.js, '/') || 'js/';
    paths.css = trailWith(paths.css, '/') || 'css/';

    options.styles = options.styles || [];
    options.scripts = options.scripts || [];
    
    var styleSwitcherHtml = '';
    // var styleSwitcherLink = '';
    if (options.styleSwitcher) {
        styleSwitcherHtml = getPartial('styles-switcher');
        options.scripts.push('styles-switcher');
        options.styles.push('styles-switcher');
        options.styles.push({name: 'ribbons', id: 'ribbons'});
    }
    
    var metaTags = makeUnaryTags('meta', options.metaTags);
    var styleBlock = makeStyleBlock(paths.css, options.styles);
    var scriptBlock = makeScriptBlock(paths.js, options.scripts);
    var title = '<title>' + options.title + '</title>';
    var head = wrap(title + metaTags + styleBlock + scriptBlock, 'head');

    var layoutIdPrefix = options.layoutIdPrefix || 'layout';
    var layout = options.layoutPartial || 'layout';
    layout = getPartial(layout);
    var partials = options.partials || {};
    Object.keys(partials).forEach(function(p) {
        var html = getPartial(partials[p]);
        var selector = {};
        selector[layoutIdPrefix + '-' +  p] = html;
        layout = Plates.bind(layout, selector); 
    });
    var menuHtml = buildMenu(options.menu);
    var menu = { "layout-menu": menuHtml };
    layout = Plates.bind(layout, menu); 
    
    // var logoHtml = getPartial('logo');
    // var logo = { "partial-logo": logoHtml };
    // layout = Plates.bind(layout, logo); 
    layout += styleSwitcherHtml;
    
    var body = wrap(layout, 'body');
    var output = '<!doctype html>\n' +
        '<!--[if IE 7 ]><html ng-app class="ie ie7" lang="en"><![endif]-->\n' +
        '<!--[if IE 8 ]><html ng-app class="ie ie8" lang="en"><![endif]-->\n' +
        '<!--[if (gte IE 9)|!(IE)]><!--><html ng-app lang="en"><!--<![endif]-->\n\n' + 
        head + body +
        '\n</html>';
    
    if (options.prettyPrintHtml) {
        output = htmlFormatter.format(output,{
            indentSize: 4,
            maxLineLength: 10,
            indent: 2
        });
    }

    // console.log(prettyHtml);
    saveFile(options.path + options.out, output);
    console.log('Created index.html');

    
}

exports.render = render;


var menu = [
    { label: 'Home', icon: 'home', href: '#', id: 'current'
      
       ,sub: [
           { label: 'Submenu item 1', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
       ]
    } 
    ,{ label: 'About us', icon: 'home', href: '#',
       sub: [
           { label: 'Submenu item 1', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
       ]
     } 
    ,{ label: 'Courses', icon: 'home', href: '#', id: 'current'
       ,sub: [
           { label: 'Submenu item 1', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
       ]
    } 
    ,{ label: 'Professional developement', icon: 'home', href: '#', id: 'current'
       ,sub: [
           { label: 'Submenu item 1', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
       ]
    } 
    ,{ label: 'Blog', icon: 'home', href: '#', id: 'current'
       ,sub: [
           { label: 'Submenu item 1', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
           ,{ label: 'Submenu item 2', href: 'index.html'}
       ]
       
    } 
];


var options =  {
    // paths: {
    //     js: 'js'
    //     ,css: 'css'
    //     ,font: 'font'
    // },
    title : 'mytitle',
    metaTags : [
        { charset:'utf-8' },
        { name: "viewport"
          ,content: "width=device-width, initial-scale=1, maximum-scale=1"
        } ],
    scripts : [
        'jquery',
        
        // Modernizr is a small JavaScript library that detects the
        // availability of native implementations for next-generation
        // web technologies, i.e. features that stem from the HTML5
        // and CSS3 specifications. Many of these features are already
        // implemented in at least one major browser (most of them in
        // two or more), and what Modernizr does is, very simply, tell
        // you whether the current browser has this feature natively
        // implemented or not.
        'modernizr',
        
        // An awesome, fully responsive jQuery slider toolkit.
        // 'flexslider',
        
        // 'twitter',//??
        
        //FancyBox is a tool for displaying images, html content and
        // multi-media in a Mac-style "lightbox" that floats overtop
        // of web page.
        // 'fancybox',
        
        // An exquisite jQuery plugin for magical layouts
        // Features:
        // Layout modes: Intelligent, dynamic layouts that can’t be achieved with CSS alone.
        // Filtering: Hide and reveal item elements easily with jQuery selectors.
        // Sorting: Re-order item elements with sorting. Sorting data
        // can be extracted from just about anything.
        // Interoperability: features can be utilized together for a
        // coheive experience.
        // Progressive enhancement: Isotope’s animation engine takes
        // advantage of the best browser features when available — CSS
        // transitions and transforms, GPU acceleration — but will
        // also fall back to JavaScript animation for lesser browsers.
        // 'isotope',
        
        //css framework
        'bootstrap'
        
        // A lightweight, easy-to-use jQuery plugin for fluid width video embeds.       
        // ,'jquery.fitvids'
        
        //Tweaks: Menu slide, responsive menu, image overlay, fancybox and icon spin
        // ,'custom'
        
        //Tweaks: Menu slide, responsive menu
        ,'menu-slide'
        
        //* Converts your <ul>/<ol> navigation into a dropdown list for small screens
        ,'selectnav'
        
        // The Responsive Slider with Advanced CSS3 Transitions
        ,'sequence.jquery-min'
        ,'sequence'
        
        ,'twitter'
        
        // Parallax Content Slider with CSS3 and jQuery A content
        // slider with delayed animations and background parallax effect
        // ,'jquery.cslider.js'
    ],
    // fonts: [
    // ],
    styles : [
        //google font for mobile ?
        'css439e' 
        
        //css framework
        ,"bootstrap"
        
        /* Turns menu classed ul, li structure into a dropdown menu  */
        
        ,"navigation"
        
        //extra responsive rules
        ,'style-responsive' 
        
        //The iconic font designed for use with Twitter Bootstrap
        ,"font-awesome"
        
        // This file overrides the default bootstrap. The reason
        // is to achieve a small width
        ,'override'
        
        ,'message-top'
        
        //colors, with extra attrs so styles switcher can find it
        ,{ name: 'colors/dirty-green', media: 'all', id: 'colors'}
        
        //footer
        ,'footer'
        ,'photo-stream'
        ,'footer-twitter-widget'
        
        ,'entry-title'
        //Css for flex-slider
        // ,'flex-slider'
        
        //FancyBox is a tool for displaying images, html content and
        // multi-media in a Mac-style "lightbox" that floats overtop
        // of web page, the css part
        // ,"fancybox"
        
        // Theme created for use with Sequence.js
        // Theme: Modern Slide In
        ,'sequence'
        
        //Custom styles
        ,'style'
    ]
    ,styleSwitcher: true
    ,menu: menu
    ,path: '/home/michieljoris/www/firstdoor/'
    ,partialsPath: 'partials/' 
    ,layoutPartial: 'layout'
    ,layoutIdPrefix: 'layout'
    ,partials: {
        logo: 'logo'
        ,contact: 'contact'
        ,message: 'message'
        ,slider: 'sequence-slider'
        ,slogan: 'slogan'
        // ,sections: 'sections'
        ,'footer-top': 'footer-top'
        ,'footer-bottom': 'footer-bottom'
    }
    ,prettyPrintHtml: true
    ,out: 'index.html'
};


render(options);

var htmlparser = require("htmlparser2");

function formatter(html, options) {
    "use strict";
    var indentSize = options.indentSize || 4;
    var maxLineLength = options.maxLineLength || 10; 
    var defaultIndent = options.indent || 0;
    // require('console').log(options);
    
    var results = "";
 
    var indent = '                                                                                                                               ';
    var n = defaultIndent;
    indentSize = indentSize || 4;
    maxLineLength =  maxLineLength || 0;
    var lastTag;
    
    // HTMLParser("<p id=test>hello <i>world", {
    var parser = new htmlparser.Parser({
        // HTMLParser(html, {
        onopentag: function( tag, attrs ) {
            var unary=false;
            results += '\n' + indent.slice(0,n)  + "<" + tag;

            Object.keys(attrs).forEach(function(k) {
                results += " " + k + '="' + attrs[k] + '"';
            });
 
            results += (unary ? "/" : "") + ">";
            lastTag = tag + n;
            n+= indentSize;
        },
        onclosetag: function( tag ) {
            n-= indentSize;
            if (tag === 'meta') return;
            var ind;
            if (lastTag === tag + n) ind = '';
            else ind = '\n' + indent.slice(0,n);
            results += ind  + "</" + tag + ">";
        
        },
        ontext: function( text ) {
            var ind = ''; 
            if (text && text.length > 0 && text[0] !== '\n') {
                if (text.length > maxLineLength) {
                    lastTag = '';
                    ind = '\n' + indent.slice(0,n);
                }  
                results +=  ind + text ;
            }
        },
        comment: function( text ) {
            lastTag = '';
            if (text && text.length > 0)
                results += indent.slice(0,n) + "<!--" + text + "-->";
        }
    });
    
    // parser.write("Xyz <script language= javascript>var foo = '<<bar>>';< /  script>");
    parser.write(html);
    parser.done();
    return results.slice(1);
}

exports.format = formatter;

var org = require("org");

var parser = new org.Parser();

// function getPreBlocks(str) {
//     var idx = 0;
//     function nextPreBlock() {
//         //opening
//         var check = str.indexOf('</pre>', idx);
//         idx = str.indexOf('<pre>', idx);
//         if (idx === -1) return -1;;
//         if (check !== -1 && check < idx)
//             console.log('Expecting opening <pre>, found closing </pre>, ignoring'.red);
//         if (check === -1) console.log('Missing closing </pre>'.red);
//         var start = idx;
//         idx+=5;
//         //closing
//         check = str.indexOf('<pre>', idx);
//         idx = str.indexOf('</pre>', idx);
//         if (idx === -1) return -1;
//         if (check !== -1 && check < idx)
//             console.log('Expecting closing </pre>, found opening <pre>, ignoring'.red);
//         idx +=5;
//         var end = idx;
//         return { start: start, end: end };
//     }

//     var result = [];
//     if (typeof str === 'string') {
//         var pre = nextPreBlock();
//         while (pre !== -1) {
//             result.push(pre);
//             pre = nextPreBlock();
//         }
//     }
//     return result;
// }

module.exports = function(orgCode) {
    var orgDocument = parser.parse(orgCode);
    var orgHTMLDocument = orgDocument.convert(org.ConverterHTML, {
        headerOffset: 1,
        exportFromLineNumber: false,
        suppressSubScriptHandling: false,
        suppressAutoLink: false
    });
    // console.log(orgHTMLDocument);
    var contentHtml = orgHTMLDocument.contentHTML;
    var tocHtml = orgHTMLDocument.tocHTML;
    
    // var preBlocks = getPreBlocks(contentHtml);
    // var pre = preBlocks[0];
    // var meta = pre ? contentHtml.slice(0, pre.end) : '';
    // var content = pre ? contentHtml.slice(pre.end) : contentHtml;
    // return orgHTMLDocument;
    return '<div id="toc">' + tocHtml + '</div>' + contentHtml;
    // return contentHtml;
    
    // return meta + '\n' + tocHtml + '\n' + contentHtml;
};


// console.dir(orgHTMLDocument); // => { title, contentHTML, tocHTML, toc }
// console.console.log(orgHTMLDocument.toString()); // => Rendered HTML
// console.console.log(html); 
//  // console.console.log(html); 
// fs.writeFileSync('./readme.html',
//   // '<script type="text/javascript" src="./org.js"></script>' +
  
//     '<link rel="stylesheet" href="./bootstrap.css" />' +
//     '<link rel="stylesheet" href="./tweak.css" />' +
  
//     '<link rel="stylesheet" href="./prettify.css" />' +
		 
//     // '<script type="text/javascript" src="./jquery-2.0.3.min.js"></script>' +
		 
// 		 '<script type="text/javascript" src="./prettify.js"></script>' +
//   html
//   );
  

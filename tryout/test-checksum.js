
var crypto = require('crypto');
var fs = require('fs');
var colors = require('colors');
var hashes = crypto.getHashes();
var Path = require('path');
var log = function() {
    console.log.apply(console, arguments); };
var a = 'bla.pdf';
log(Path.extname(a));
var html = "asdfasdfds<a href='bla'>link</a>   <a href='two' >l2</a>";
var cheerio = require('cheerio'),
    $ = cheerio.load(html);
// log($('a'));
var r = $('a').map(function(i, e) {
    log(i, e.attribs.href);
    e.attribs.href = 'okthen';
    return e;
});

log($.html());
// log($.html());
// $('a').attr('href', 'replace').html();;

// log($.html());


// log($(html))
// function cachify(path) { return 'abc'; }
// function makeCachifyPartial(list) {
//     list = list || [];
//     var start = "<script type='text/javascript'>\n  function cachify(path) {\n" +
//         "    var map = {\n";
//     var end = "\n    };\n    return map[path] || path; }\n</script>";
//     list = list.map(function(p) {
//         return '      "' + p.toString() + '": "' + cachify(p) + '"';
//     });
//     list = list.join(',\n');
//     return start + list + end;
// }

// console.log(makeCachifyPartial([ 'bla/com', 'ok.bla' ]));

// function format(fmt, args) {
//     if (fmt.indexOf('%d') != -1 ||
//         fmt.indexOf('%j') != -1) {
//         throw "This format only supports %s placeholders";
//     }
//     if (typeof arguments[0] != 'string') {
//         throw "First argument to format, must be a format string";
//     }
//         var i = 0;
//     var params = arguments;
//     return fmt.replace(/%s/g, function () {
//         i++;
//         if (params[i] === undefined) {
//             throw "Number of arguments didn't match format placeholders.";
//         }
//         return params[i];
//     });
// } 
// var options = { stamp: { prefix: '__', length: 10  }};

// function stripStamp(path) {
//     var url = path;   
//     var prefix = options.stamp.prefix;
//     var fmt = format('^\\/%s[a-f0-9]{10}', options.stamp.prefix);
//     var m = path.match(new RegExp(fmt));
//     if (m && m.index === 0) {
//         // extract the hash
//         var hash = path.slice(prefix.length + 1, prefix.length + 1 + options.stamp.length);
//         // 10 first characters of md5 + 1 for slash
//         url = path.slice(prefix.length + 1 + options.stamp.length);
//         console.log('url', url, 'hash', hash);

//         // exists = false;

//         // if (opts.prefix !== '' &&
//         //     uri.indexOf('/' + opts.prefix) === 0) {
//         //     exists = true;
//         // } else if (assets[true_path]) {
//         //     exists = true;
//         // }

//         // if (exists === false) {
//         //     if (_cache[true_path]) {
//         //         if (_cache[true_path].exists === true) {
//         //             exists = true;
//         //         }
//         //     } else {
//         //         // Would we ever want to use cachify for non-file resources?
//         //         if (existsSync(true_path)) {
//         //             exists = true;
//         //             _cache[true_path] = {exists: true};
//         //         } else {
//         //             // Hmm potential DOS Attack here... maybe we shouldn't cache
//         //             // checking disk every time isn't that bad - just like static
//         //             // middleware
//         //             // Or use an LRU?
//         //             console.warn('Cachify like URL, but no file found');
//         //             _cache[true_path] = {exists: false};
//         //         }
//         //     }
//         // }
//         // console.log(m);   
//     } 
//     return { path: url, stamp: hash };
// }

// console.log(stripStamp('/__aabcdefacd/blabla'));

// // function getCalcStamp(settings) {
// //     return settings.method === 'mtime'  ?
// //         function (pathName) { 
// //             return fs.statSync(pathName).mtime.getTime(); }
// //     : function (file) { 
// //         var sum = crypto.createHash(settings.method);
// //         sum.update(fs.readFileSync(file));
// //         return sum.digest('hex').slice(0, settings.length);
// //     };
// // }

// // function stampDo(prefix, pathName, exclude) {
// //     exclude = exclude || [];
// //     var stamp;
// //     var ext = Path.extname(pathName).slice(1);
// //     if (~exclude.indexOf(ext)) return pathName;
// //     try {
// // 	stamp = calcStamp(pathName);
	
// //     } catch(e) { console.log('Failed to stamp '.red + pathName.green + ' err: '.red + e);
// // 		 return pathName;
// // 	       }
// //     return Path.join(prefix + stamp, pathName);
// // }


// // var calcStamp = getCalcStamp({ method: 'md5', length: 10});
// // console.log(calcStamp.toString());
// // var r = stampDo('__', 'pdf.pdf', ['pdf']);
// // console.log(r);



// // console.log(fs.statSync('pdf.pdf').mtime.getTime());
// // // console.log(hashes); // ['sha', 'sha1', 'sha1WithRSAEncryption', ...]

// // var md5 = require('md5-file');

// // function checksum(file) {
// //     var sum = crypto.createHash('sha1');
// //     sum.update(fs.readFileSync(file));
// //     return sum.digest('hex');
// // }


// //   function stampDo(file) {
// //     var hash;
// //       try {
// // 	// return Date.parse(fs.statSync(file).mtime);
// // 	return file + '.' + checksum(file);
	
// //       } catch(e) { console.log('Failed to stamp '.red + file.green + ' err: '.red + e);
// // 		   return file;
// // 	       }
// //   }

// // // for (var i=0; i<100;i++)  
// // // {
// // //   var r = stampDo('pdf.pdf', 'hash') ;
// // // console.log(r); 
// // // } 
// // // console.log(r); 

// // // for (var i=0; i<100;i++)  
// // //     {
// // //       // var r = md5('jpg.jpg'); // '18e904aae79b5642ed7975c0a0074936'
// // //       var r = md5('pdf.pdf'); // '18e904aae79b5642ed7975c0a0074936'
// // //     }
// // // // var r = md5('jpg.jpg'); // '18e904aae79b5642ed7975c0a0074936'
// // //  console.log(r); 
// // // var r = md5('pdf.pdf'); // '18e904aae79b5642ed7975c0a0074936'
// // //  console.log(r); 
 
 
// //  // var checksum = require('checksum');

// //  // var r = checksum.file('pdf.pdf' , function (err, sum) {
// //  //   console.log('heelo');
// //  // });

// // //  var filename = 'pdf.pdf';
// // // var fs = require('fs');

// // //  var shasum = []; 
// // // for (var i=0; i<10;i++)  
// // //     {
// // //       shasum[i] = crypto.createHash('sha1');
// // //       var s = fs.ReadStream(filename);
// // //       s.on('data', function(d) {
// // // 	shasum[i].update(d);
// // //       });

// // //       s.on('end', function() {
// // // 	var d = shasum[i].digest('hex');
// // // 	console.log(d + '  ' + filename);
// // //       });
// // //     }

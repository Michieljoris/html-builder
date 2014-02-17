
var crypto = require('crypto');
var fs = require('fs');
var colors = require('colors');
var hashes = crypto.getHashes();
var Path = require('path');


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

function stampDo(prefix, pathName, exclude) {
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


var calcStamp = getCalcStamp({ method: 'md5', length: 10});
console.log(calcStamp.toString());
var r = stampDo('__', 'pdf.pdf', ['pdf']);
console.log(r);



// console.log(fs.statSync('pdf.pdf').mtime.getTime());
// // console.log(hashes); // ['sha', 'sha1', 'sha1WithRSAEncryption', ...]

// var md5 = require('md5-file');

// function checksum(file) {
//     var sum = crypto.createHash('sha1');
//     sum.update(fs.readFileSync(file));
//     return sum.digest('hex');
// }


//   function stampDo(file) {
//     var hash;
//       try {
// 	// return Date.parse(fs.statSync(file).mtime);
// 	return file + '.' + checksum(file);
	
//       } catch(e) { console.log('Failed to stamp '.red + file.green + ' err: '.red + e);
// 		   return file;
// 	       }
//   }

// // for (var i=0; i<100;i++)  
// // {
// //   var r = stampDo('pdf.pdf', 'hash') ;
// // console.log(r); 
// // } 
// // console.log(r); 

// // for (var i=0; i<100;i++)  
// //     {
// //       // var r = md5('jpg.jpg'); // '18e904aae79b5642ed7975c0a0074936'
// //       var r = md5('pdf.pdf'); // '18e904aae79b5642ed7975c0a0074936'
// //     }
// // // var r = md5('jpg.jpg'); // '18e904aae79b5642ed7975c0a0074936'
// //  console.log(r); 
// // var r = md5('pdf.pdf'); // '18e904aae79b5642ed7975c0a0074936'
// //  console.log(r); 
 
 
//  // var checksum = require('checksum');

//  // var r = checksum.file('pdf.pdf' , function (err, sum) {
//  //   console.log('heelo');
//  // });

// //  var filename = 'pdf.pdf';
// // var fs = require('fs');

// //  var shasum = []; 
// // for (var i=0; i<10;i++)  
// //     {
// //       shasum[i] = crypto.createHash('sha1');
// //       var s = fs.ReadStream(filename);
// //       s.on('data', function(d) {
// // 	shasum[i].update(d);
// //       });

// //       s.on('end', function() {
// // 	var d = shasum[i].digest('hex');
// // 	console.log(d + '  ' + filename);
// //       });
// //     }

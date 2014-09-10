var fs = require('fs-extra');
var crypto = require('crypto');
var Path = require('path');
  
module.exports.saveFile = function saveFile(pathName, str, vow){
    
    var oldHash, newHash;
    try {
        var sum = crypto.createHash('sha1');
        // var orig = fs.readFileSync(pathName);
        sum.update(fs.readFileSync(pathName));
        oldHash = sum.digest('hex');
    } catch(e) {} 
    
    if (oldHash) {
        sum = crypto.createHash('sha1');
        sum.update(str);
        newHash = sum.digest('hex');
        if (newHash === oldHash) {
            if (vow) vow.keep();
            return true;
        }
    }
    // console.log(orig.length, orig.toString());
    // console.log('-=====================================');
    // console.log(str.length, str);
    // console.log('Saving ' + pathName);
    try {
        fs.outputFileSync(pathName, str, 'utf8');
        if (vow) vow.keep();
        
    } catch(e) {
        console.log('Error in saveFile:', e);
        if (vow) vow.breek('Error writing file '+ pathName + e.toString());
    }
    return true;
}
  
function endsWith(str, trail) {
    return (str.substr(str.length-trail.length, str.length-1) === trail);
};
  
module.exports.endsWith = endsWith;

module.exports.trailWith = function trailWith(str, trail) {
    return typeof str === 'string' ? (str + (!endsWith(str, trail) ? trail : '')) : undefined;
};

module.exports.isModule = function(path) {
    return Path.extname(Path.basename(path, Path.extname(path))) === '.nm';
    // if (path.indexOf('modules/') === 0) return '.' + path.slice(7);
    // if (path.indexOf('/modules/') === 0) return '.' + path.slice(8);
    return false;
};


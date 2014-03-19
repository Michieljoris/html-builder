var fs = require('fs-extra');
var crypto = require('crypto');
  
module.exports.saveFile = function saveFile(pathName, str){
    var oldHash, newHash;
    try {
        var sum = crypto.createHash('sha1');
        var orig = fs.readFileSync(pathName);
        sum.update(fs.readFileSync(pathName));
        oldHash = sum.digest('hex');
    } catch(e) {} 
    if (oldHash) {
        sum = crypto.createHash('sha1');
        sum.update(str);
        newHash = sum.digest('hex');
        // console.log(newHash, oldHash);
        if (newHash === oldHash) return false;
    }
    // console.log(orig.length, orig.toString());
    // console.log('-=====================================');
    // console.log(str.length, str);
    // console.log('Saving ' + pathName);
    fs.writeFileSync(pathName, str, 'utf8');
    return true;
};
  
  
  
module.exports.endsWith = function endsWith(str, trail) {
    return (str.substr(str.length-trail.length, str.length-1) === trail);
};


module.exports.trailWith = function trailWith(str, trail) {
    return str ? (str + (!endsWith(str, trail) ? trail : '')) : undefined;
};

var Path = require('path');
var fs = require('fs');

var utils = require('src/utils');

var saveFile = utils.saveFile;
var trailWith = utils.trailWith;
var endsWith = utils.endsWith;

function concat(paths, blocks, ext, out) {
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
	    // fs.writeFileSync(Path.join(paths.root, paths.www, fileName), data);
	    saveFile(Path.join(paths.root, paths.www, out, fileName), data);
	    return { id: block.id, files: [fileName], path: out };
        });
    }
    return blocks;
} 
  


//----------------------test
var paths = {
    
};
var scriptBlock = [
    { id:'b1', path: 'somepath', files: ['a', 'b', 'c', 'modules/m1', 'e', '/modules/m2', 'f']}
    ,{ id:'b2', path: 'somepath', files: ['g', 'f', 'h', 'modules/m3', 'i', '/modules/m4', 'j']}
];
var pathOut = 
concat(paths, scriptBlock, '.js', pathOut );

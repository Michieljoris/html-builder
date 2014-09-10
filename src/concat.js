require('colors');
var Path = require('path');
var fs = require('fs');
var denodify = require('denodify');

var utils = require('./utils');

var saveFile = utils.saveFile;
var trailWith = utils.trailWith;
var endsWith = utils.endsWith;
var isModule = require('./utils').isModule;

//If there are scripts in a language other
//than javascript in the block, the files will still be
//concatenated, but not denodify.wrapped. Instead the
//resulting concatenated file will have an extension of
//.bundle and a first line of what is contained within the
//bundle. Bb-server can then extract this line, split up the
//bundle, recast the parts to js, denodify.wrap the module
//scripts, bundle it up again, cache and send it (as a
//proper js file).

function concat(paths, block, bundle) {
    var indices = [];
    var index = 0;
    var result =  block.files
	.map(function(f) {
	    return { abs: Path.join(paths.root , paths.www, block.path, f), rel: f };
	})
	.filter(function(f) {
	    if (fs.existsSync(f.abs)) return true;
	    else console.log('Warning: '.red + 'Not found: ' + f.abs.yellow);
	    return false;
	})
	.map(function(f) {
	    var data = fs.readFileSync(f.abs).toString();
            if (bundle && isModule(f.rel)) {
                data = denodify.wrap(f.rel, data);
            }
	    data = ('//*' + f.rel + '*//\n' + data) + '\n;\n';
            if (bundle) { indices.push('"' + f.rel + '": ' + index);
                          index +=  data.split(/\n/).length -1;
                        }
            return data;
	}).join('');
    return (bundle ? '{' + indices.join(',') + '}\n' : '') + result;
}

module.exports.concat = function (paths, blocks, ext) {
    console.log('concatenating..', ext);
    if (blocks && blocks.length) {
        blocks = Array.isArray(blocks) ? blocks : [blocks];
        blocks = blocks.map(function(block) {
            var mixed;
	    block.files = Array.isArray(block.files) ? block.files : [block.files];
            mixed = block.files.some(function(f) {
                return Path.extname(f) !== ext;
            });
	    var fileName = trailWith(block.id, mixed ? '.bundle' : ext);
            console.log(fileName, '-------------------------------------');
            var data = concat(paths, block, mixed);
            // console.log(data, '\n');
	    saveFile(Path.join(paths.root, paths.www, block.path, fileName), data);
	    return { id: block.id, files: [fileName], path: block.path };
        });
    }
    return blocks;
}; 

// // ----------------------test
// var paths = {
//     root : '../',
//     www: 'test'
// };

// var scriptBlock = [
//     { id:'mixedBlock', path: 'test_concat', files: ['a.js', 'modules/m1.js', 'c.js', 'b.coffee']},
//     { id:'myblock', path: 'test_concat', files: ['a.js', 'b.js']}
// ];
// var pathOut =  '../test';
// var result = module.exports.concat(paths, scriptBlock, '.js' );
// console.log('\nnew scriptblock:-----------------\n',result);

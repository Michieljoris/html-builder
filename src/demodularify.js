var denodify = require('denodify');
var VOW = require('dougs_vow');
var Path = require('path');
var fs = require('fs-extra');
var isModule = require('./utils').isModule;
var trailWith = require('./utils').trailWith;

function insertScriptList(files, index, wwwPath, scriptPath, moduleId) {
    var vow = VOW.make();
    // console.log(moduleId);
    denodify.list(wwwPath,Path.join(scriptPath, Path.dirname(moduleId)), Path.basename(moduleId),
                  function(err, list) {
                      if (err) vow.breek(err);
                      else {
                          // files[index] = list.map(function(m) { return m.route; });
                          files[index] = list;
                          console.log('found files:\n', files[index]);
                          vow.keep(); }
                  });
    return vow.promise;
}


function processOneScriptBlock(wwwPath, sb, denodifyPath) {
    var vow = VOW.make();
    var vows = [];
    var files = sb.files;
    var index = 0;
    var containsModules = false;
    
    files.forEach(function(f) {
        //TODO to be autodetected later by being clever using recast, detective and caching
        //for now just indicate it is a module by clamping it within [ and ]
        if (typeof f !== 'string') { 
            containsModules = true;
            vows.push(insertScriptList(files, index, wwwPath, sb.path, f[0]));
        }
        else vows.push(VOW.kept(sb.files));
        index++;
    }); 
    if (!vows.length) vow.keep(sb);
    
    else VOW.every(vows).when(
        function() {
            var newList = [];
            if (containsModules) newList.push(denodifyPath);
            files.forEach(function(f) {
                if (typeof f === 'string') newList.push(Path.join(sb.path || '', f));
                else {
                    f.forEach(function(f) {
                        var route = f.route;
                        var ext = Path.extname(route);
                        //mark modules by adding .nm to the filename
                        //TODO also add preresolved name and path of file that requires it1!!
                        route = Path.dirname(route) + '/' + Path.basename(route, ext) + '.nm' + ext;
                        newList.push(route + "?module=true&id=" + f.id);
                        // console.log(f);
                    });
                }
            }); 
            sb.files = newList;
            sb.path = '';
            vow.keep(sb);
        },
        function(err) {
            vow.breek(err);
        }
    );
    return vow.promise;
}

function deduplicate(blocks) {
    var listed = {};
    blocks.forEach(function(b) {
        b.files = b.files.filter(function(f) {
            var path = Path.join(b.path, f);
            var isDuplicate = listed[path];
            listed[path] = true;
            return !isDuplicate;
        });
    }); 
}

function demodularify(scriptBlock, wwwPath, cb) {
    //make sure there is a denodify script in the scripts directory to load
    var denodifyPath = Path.join(wwwPath, 'scripts', 'denodify.js');
    try {
        fs.statSync(Path.resolve(denodifyPath));
    } catch (e) {
        console.log('demodularify: scripts/denodify not found, adding one.'.red);
        fs.outputFileSync(Path.resolve(denodifyPath), denodify.script);
    } 
    var vows = [];
    scriptBlock.forEach(function(sb) {
        vows.push(processOneScriptBlock(wwwPath, sb, Path.join(sb.path || '', 'denodify.js')));
    });
    VOW.every(vows).when(
        function(blocks) {
            deduplicate(blocks);
            cb(null, blocks);
        },
        function(err) {
            cb({ err: err}, scriptBlock);
        });
}

module.exports = demodularify; 

// //----------------test----------------
// demodularify([
//     { id:'b1', path: 'somepath', files: ['a', 'b', 'c', ['modules/m1'], 'e', '/modules/m2', 'f']}
//     ,{ id:'b2', path: 'somepath', files: ['g', 'f', 'h', 'modules/m3', 'i', '/modules/m4', 'j']}
// ], Path.resolve('./test'), function(err, sb) {
//     if (err) console.log(err);
//     else console.log(sb);
// });
  
// var p = 'a/b/c/name.ext';
// console.log(Path.dirname(p));
// console.log(Path);

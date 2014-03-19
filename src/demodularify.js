var denodify = require('denodify');
var VOW = require('dougs_vow');
var Path = require('path');
var fs = require('fs-extra');
var inModulesPath = require('./utils').inModulesPath;

var qdnString = "var qdn=qdn||{require:function(module) {return qdn.m[module].exports;},m:{}};";

function insertScriptList(files, index, wwwPath, moduleId) {
    var vow = VOW.make();
    denodify.list(wwwPath, 'modules', moduleId, function(err, list) {
        if (err) vow.breek(err);
        else {
            files[index] = list.map(function(m) { return m.id; });
            vow.keep(); }
    });
    return vow.promise;
}

function processOneScriptBlock(wwwPath, sb, qdnPath) {
    var vow = VOW.make();
    var vows = [];
    var files = sb.files;
    var index = 0;
    var containsModules = false;
    files.forEach(function(f) {
        var moduleId = inModulesPath(f);
        if (moduleId) {
            containsModules = true;
            vows.push(insertScriptList(files, index, wwwPath, moduleId)); 
        }
        index++;
    }); 
    VOW.every(vows).when(
        function() {
            var newList = [];
            //qdn.js:
            // var qdn=qdn||{require:function(module) {return qdn.m[module].exports;},m:{}};
            if (containsModules) newList.push(qdnPath);
            files.forEach(function(f) {
                if (typeof f === 'string') newList.push(f);
                else {
                    f.forEach(function(f) {
                        newList.push(Path.join('modules', f));
                    });
                }
            }); 
            sb.files = newList;
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

function demodularify(jsPath, scriptBlock, wwwPath, cb) {
    var qdnPath = Path.join(jsPath, 'qdn.js');
    try {
        fs.statSync(Path.resolve(qdnPath));
    } catch (e) {
        fs.writeFileSync(qdnPath, qdnString);
        console.log('Added qdn.js to ' + jsPath);
    } 
    var vows = [];
    scriptBlock.forEach(function(sb) {
        vows.push(processOneScriptBlock(wwwPath, sb, qdnPath));
    });
    VOW.every(vows).when(
        function(blocks) {
            deduplicate(blocks);
            cb(null, blocks);
        },
        function(err) {
            cb(err, null);
        });
}

module.exports = demodularify; 

//----------------test----------------
demodularify('test', [
    { id:'b1', path: 'somepath', files: ['a', 'b', 'c', 'modules/m1', 'e', '/modules/m2', 'f']}
    ,{ id:'b2', path: 'somepath', files: ['g', 'f', 'h', 'modules/m3', 'i', '/modules/m4', 'j']}
], Path.resolve('./test'), function(err, sb) {
    if (err) console.log(err);
    else console.log(sb);
});
  
 

/**
 * Created by wlh on 15/12/24.
 */

/**
 * 命名规则为 api/模块名/index.test.js
 *
 * api/index.test.js 将自动require文件名为 index.test.js 的文件
 */

var fs = require("fs");
var path = require("path");

var files = fs.readdirSync(__dirname);

//筛选是文件件的目录
var dirs = files.filter(function(f) {
    var state = fs.statSync(path.join(__dirname, f));
    return state.isDirectory();
});

//筛选是index.test.js的文件
for(var i= 0, ii=dirs.length; i<ii; i++) {
    var dir = path.join(__dirname, dirs[i]);
    //是否有index.test.js
    var testF = path.join(dir, "index.test.js")
    if(fs.existsSync(testF)) {
        require(testF);
    }
}

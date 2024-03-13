const fs = require("fs");
const ejs = require("ejs");
/* 
@param filename 文件路径 views下文件路径
@param opt {srcRootPath:"views/api",destRootPath:"lite"}
*/

module.exports.handler = function (filename,opt){
    if ('undefined'==typeof opt) {
        console.log("缺少{srcRootPath:,destRootPath:}属性");
        return ;
    }
    if (filename.indexOf(opt.srcRootPath)==-1){
        console.log(`${filename}文件不在${opt.srcRootPath}目录下,参数错误`);
        return ;
    }
    let srcRootPathIndex = filename.indexOf(opt.srcRootPath) + opt.srcRootPath.length;
    let destFilename = opt.destRootPath + filename.slice(srcRootPathIndex) //  api/xx/xxx.ejs
    //console.log("源文件"+filename+",目录文件"+destFilename);
    let parentDir = destFilename.slice(0,destFilename.lastIndexOf('/'));
    if (filename.lastIndexOf('.ejs')>-1){
        var parentItemDir = opt.destRootPath; //destFilename.slice(srcRootPathIndex,filename.indexOf('/',srcRootPathIndex))
        if (parentItemDir=='lite'){
            opt.jsSuffix='.lite',opt.themeCode="lite";
        }else if (parentItemDir=='lightblue'){
            opt.jsSuffix='.lightblue',opt.themeCode="lightblue";
        }else{
            opt.jsSuffix="",opt.themeCode="blue";
        }
        ejs.renderFile(filename,opt,function(err,str){
            if (err){
                console.error(err);
            }else{
                let htmlFileName = destFilename.slice(0,destFilename.lastIndexOf('.'))+".html" 
                if (!fs.existsSync(parentDir)){
                    fs.mkdirSync(parentDir);
                }
                fs.writeFile(htmlFileName,str,'utf-8',function(fserr){
                    if (fserr){
                        console.error(fserr);
                    }else{
                        //console.log('成功生成：'+htmlFileName);
                    }
                });
            }
        })
    }else{
        if (!fs.existsSync(parentDir)){
            fs.mkdirSync(parentDir);
        }
        fs.copyFile(filename,destFilename,function(){
            //console.log('复制'+destFilename);
        });
    }
}
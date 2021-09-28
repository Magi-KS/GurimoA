let FastGlob = require('fast-glob');
let FrontMatter = require('front-matter');
let Fs = require('fs/promises');
let Path = require('path');
const contentRoot = 'src/contents'

let files = FastGlob.sync('src/**/*.md');
let filesPromise = files.map((file) => {
  return Fs.readFile(file, {encoding: 'utf8'});
});

Promise.all(filesPromise).then((filesContent) => {
  contentIndex = 
    filesContent.map((fileContent, index) => {
      let fileMeta = FrontMatter(fileContent).attributes
      return {
        path: urlFromPath(files[index]),
        title: fileMeta.title,
        timeStamp: fileMeta.timeStamp
      }
    });
  return contentIndex;
})
.then((contentIndex) => {
  let data = JSON.stringify(contentIndex);
  Fs.writeFile(contentRoot + '/index.json', data)
})

function urlFromPath(path){
  contentPath = Path.relative(contentRoot, path);
  pathAttributes = Path.parse(contentPath);
  return Path.format({
    root: '/',
    dir: pathAttributes.dir,
    name: pathAttributes.name
  })
}

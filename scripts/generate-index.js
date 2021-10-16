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
  contentIndex.sort(indexByTime);
  contentIndex.map(formatTime);
  let data = JSON.stringify(contentIndex);
  Fs.writeFile(contentRoot + '/index.json', data)
})

function indexByTime(item1, item2) {
  let date1 = new Date(item1.timeStamp);
  let date2 = new Date(item2.timeStamp);
  let outcome = {};
  outcome[true] = 1;
  outcome[false] = -1;
  return outcome[date1 < date2];
}

function formatTime(item) {
  item.timeStamp = item.timeStamp.split('T')[0];
  return item;
}

function urlFromPath(path){
  contentPath = Path.relative(contentRoot, path);
  pathAttributes = Path.parse(contentPath);
  return Path.format({
    root: '/',
    dir: pathAttributes.dir,
    name: pathAttributes.name
  })
}

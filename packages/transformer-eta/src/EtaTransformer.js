import {Transformer} from '@parcel/plugin';
import {promisify} from 'util';
import * as Eta from 'eta';
import Path from 'path';

const siteName = 'GurimoA';

export default new Transformer({
  async transform({asset, resolve, options}) {
    asset.type = 'html';

    Eta.configure({
      autoEscape: false,
      cache: false,
      async: true,
      views: Path.join(options.projectRoot, "/src/views")
    });

    let code = await asset.getCode();
    let parsedCode = '';

    try {
      let data = JSON.parse(code)
      let viewTemplate = 'index';
      parsedCode = await Eta.renderFileAsync(viewTemplate, {
        content: data,
        title: siteName
      });
    }
    catch(e) {
      let metaViewTemplate = asset.meta.frontMatter && asset.meta.frontMatter.viewTemplate
      let viewTemplate =  metaViewTemplate || "/default";
      parsedCode = await Eta.renderFileAsync(viewTemplate, {
        content: code,
        ...asset.meta.frontMatter,
        title: pageTitle(asset.meta.frontMatter.title)
      });
    }

    asset.setCode(parsedCode);
    return [asset];
  },
});

function pageTitle(title) {
  return title ? `${siteName} - ${title}` : siteName
}

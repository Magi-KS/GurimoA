import {Transformer} from '@parcel/plugin';
import {promisify} from 'util';
import * as Eta from 'eta';
import Path from 'path';

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

    try {
      let data = JSON.parse(code)
      let viewTemplate = 'index';
      let parsedCode = await Eta.renderFileAsync(viewTemplate, {
        content: data
      });
      asset.setCode(parsedCode);
    }
    catch(e) {
      let metaViewTemplate = asset.meta.frontMatter && asset.meta.frontMatter.viewTemplate
      let viewTemplate =  metaViewTemplate || "/default";
      let parsedCode = await Eta.renderFileAsync(viewTemplate, {
        content: code,
        ...asset.meta.frontMatter
      });
      asset.setCode(parsedCode);
    }

    return [asset];
  },
});

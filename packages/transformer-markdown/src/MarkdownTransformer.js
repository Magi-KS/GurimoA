import {Transformer} from '@parcel/plugin';
import {promisify} from 'util';
import marked from 'marked';

const markedParse = promisify(marked.parse);

export default new Transformer({
  async transform({asset, resolve, options}) {
    asset.type = 'html';

    let code = await asset.getCode();

    let parsedCode = await markedParse(code, {
      renderer: new marked.Renderer(),
    });

    asset.setCode(parsedCode);
    return [asset];
  },
});

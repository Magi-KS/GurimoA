import {Transformer} from '@parcel/plugin';
import FrontMatter from 'front-matter';

export default new Transformer({
  async transform({asset, resolve, options}) {
    let code = await asset.getCode();

    let parsedCode = FrontMatter(code);

    asset.meta.frontMatter = parsedCode.attributes;
    asset.setCode(parsedCode.body);
    return [asset];
  },
});

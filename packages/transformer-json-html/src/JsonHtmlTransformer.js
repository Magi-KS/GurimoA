import {Transformer} from '@parcel/plugin';

export default new Transformer({
  async transform({asset, resolve, options}) {
    asset.type = 'html';
    let code = await asset.getCode();

    asset.setCode(code);
    return [asset];
  },
});

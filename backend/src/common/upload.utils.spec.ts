import { imageFileFilter, trackFileFilter } from './upload.utils';

describe('upload.utils', () => {
  it('imageFileFilter acepta imágenes y rechaza otros tipos', () => {
    const ok = jest.fn();
    imageFileFilter(null, { mimetype: 'image/png' }, ok);
    expect(ok).toHaveBeenCalledWith(null, true);

    const bad = jest.fn();
    imageFileFilter(null, { mimetype: 'application/x-msdownload' }, bad);
    expect(bad.mock.calls[0][1]).toBe(false);
    expect(bad.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('trackFileFilter valida audio en audio y imagen en portada', () => {
    const a = jest.fn();
    trackFileFilter(null, { fieldname: 'audio', mimetype: 'audio/mpeg' }, a);
    expect(a).toHaveBeenCalledWith(null, true);

    const b = jest.fn();
    trackFileFilter(null, { fieldname: 'audio', mimetype: 'image/png' }, b);
    expect(b.mock.calls[0][1]).toBe(false);

    const c = jest.fn();
    trackFileFilter(null, { fieldname: 'cover', mimetype: 'audio/mpeg' }, c);
    expect(c.mock.calls[0][1]).toBe(false);
  });
});

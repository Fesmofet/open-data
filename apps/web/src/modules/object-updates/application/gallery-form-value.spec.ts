import { UPDATE_IMAGE_GALLERY_ITEM } from '@opden-data-layer/core/update-registry';

import { validateUpdateValue } from './update-value-form.utils';
import {
  initialGalleryItemFormValue,
  sanitizeGalleryItemFormValue,
} from './gallery-form-value';

describe('sanitizeGalleryItemFormValue', () => {
  it('keeps album and cid for broadcast shape', () => {
    expect(
      sanitizeGalleryItemFormValue({
        album: 'test album',
        cid: 'bafybeigdyrzt5g7s',
        url: '',
      }),
    ).toEqual({
      album: 'test album',
      cid: 'bafybeigdyrzt5g7s',
    });
  });

  it('drops empty cid and url leaving album only', () => {
    expect(
      sanitizeGalleryItemFormValue({
        album: 'test album',
        cid: '',
        url: '',
      }),
    ).toEqual({ album: 'test album' });
  });
});

describe('validateUpdateValue imageGalleryItem', () => {
  it('rejects album without image', () => {
    expect(
      validateUpdateValue(UPDATE_IMAGE_GALLERY_ITEM, {
        album: 'test album',
        cid: '',
        url: '',
      }).success,
    ).toBe(false);
  });

  it('accepts album with cid', () => {
    const result = validateUpdateValue(UPDATE_IMAGE_GALLERY_ITEM, {
      album: 'test album',
      cid: 'bafybeigdyrzt5g7s',
      url: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({
        album: 'test album',
        cid: 'bafybeigdyrzt5g7s',
      });
    }
  });

  it('initial form value includes empty cid and url keys', () => {
    expect(initialGalleryItemFormValue('Photos')).toEqual({
      album: 'Photos',
      url: '',
      cid: '',
    });
  });
});

import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import {
  computeOutputDimensions,
  getRadianAngle,
  resolveEditorAspect,
  rotateSize,
} from '@/shared/presentation/components/image-editor/image-editor-canvas';

import { imageEditorConfigForUpdateType } from './image-editor-config';

describe('image-editor-canvas helpers', () => {
  it('computeOutputDimensions scales down to maxOutputPx', () => {
    expect(computeOutputDimensions(2000, 1000, 1024)).toEqual({
      width: 1024,
      height: 512,
    });
  });

  it('computeOutputDimensions keeps small crops unchanged', () => {
    expect(computeOutputDimensions(400, 400, 1024)).toEqual({
      width: 400,
      height: 400,
    });
  });

  it('rotateSize swaps dimensions at 90 degrees', () => {
    const rotated = rotateSize(800, 600, 90);
    expect(rotated.width).toBeCloseTo(600, 0);
    expect(rotated.height).toBeCloseTo(800, 0);
  });

  it('getRadianAngle converts degrees', () => {
    expect(getRadianAngle(180)).toBeCloseTo(Math.PI, 5);
  });

  it('resolveEditorAspect uses config ratio when set', () => {
    expect(resolveEditorAspect({ aspectRatio: 1, maxOutputPx: 512, backgroundColor: '#fff' }, 800, 600)).toBe(1);
  });

  it('resolveEditorAspect uses natural ratio when free', () => {
    expect(resolveEditorAspect({ maxOutputPx: 512, backgroundColor: '#fff' }, 1600, 900)).toBeCloseTo(
      1600 / 900,
      5,
    );
  });
});

describe('imageEditorConfigForUpdateType', () => {
  it('returns square config for avatar', () => {
    const config = imageEditorConfigForUpdateType(UPDATE_TYPES.IMAGE);
    expect(config?.aspectRatio).toBe(1);
    expect(config?.maxOutputPx).toBe(1024);
  });

  it('returns free config for cover and gallery', () => {
    const cover = imageEditorConfigForUpdateType(UPDATE_TYPES.IMAGE_BACKGROUND);
    const gallery = imageEditorConfigForUpdateType(UPDATE_TYPES.IMAGE_GALLERY_ITEM);
    expect(cover?.aspectRatio).toBeUndefined();
    expect(gallery?.aspectRatio).toBeUndefined();
    expect(cover?.maxOutputPx).toBe(1920);
  });
});

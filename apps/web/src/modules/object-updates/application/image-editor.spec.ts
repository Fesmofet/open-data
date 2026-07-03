import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import {
  computeFitCropAndZoom,
  computeOutputDimensions,
  getRadianAngle,
  resolveEditorAspect,
  rotateSize,
} from '@/shared/presentation/components/image-editor/image-editor-canvas';

import { imageEditorConfigForUpdateType } from './image-editor-config';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

function mediaSize(width: number, height: number) {
  return {
    width,
    height,
    naturalWidth: width,
    naturalHeight: height,
  };
}

describe('computeFitCropAndZoom', () => {
  const squareCrop = { width: 256, height: 256 };

  it('centers landscape image in square crop with width-limited zoom', () => {
    const result = computeFitCropAndZoom(
      mediaSize(400, 300),
      squareCrop,
      0,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    expect(result.crop).toEqual({ x: 0, y: 0 });
    expect(result.zoom).toBeCloseTo(256 / 400, 5);
  });

  it('centers portrait image in square crop with height-limited zoom', () => {
    const result = computeFitCropAndZoom(
      mediaSize(300, 600),
      squareCrop,
      0,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    expect(result.crop).toEqual({ x: 0, y: 0 });
    expect(result.zoom).toBeCloseTo(256 / 600, 5);
    expect(result.zoom).toBeLessThan(256 / 300);
  });

  it('swaps bbox at 90 degrees rotation', () => {
    const result = computeFitCropAndZoom(
      mediaSize(400, 300),
      squareCrop,
      90,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    expect(result.crop).toEqual({ x: 0, y: 0 });
    expect(result.zoom).toBeCloseTo(256 / 400, 5);
  });

  it('clamps zoom to min and max bounds', () => {
    const tinyCrop = { width: 10, height: 10 };
    const huge = computeFitCropAndZoom(
      mediaSize(4000, 3000),
      tinyCrop,
      0,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    expect(huge.zoom).toBe(MIN_ZOOM);

    const small = computeFitCropAndZoom(
      mediaSize(10, 10),
      squareCrop,
      0,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    expect(small.zoom).toBe(MAX_ZOOM);
  });
});

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

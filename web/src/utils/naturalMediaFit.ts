/** Matches `max-h-[20rem]` in {@link NATURAL_MEDIA_CLASS}. */
export const NATURAL_MEDIA_MAX_HEIGHT = "20rem";

/**
 * CSS box for a single feed attachment sized like {@link NATURAL_MEDIA_CLASS}.
 * Uses the media's real aspect ratio (any width/height from metadata), not 16:9.
 *
 * Examples at a ~390px-wide column:
 * | Ratio   | Orient.   | Result                          |
 * |---------|-----------|---------------------------------|
 * | 9:16    | portrait  | ~180×320px                      |
 * | 3:4     | portrait  | ~240×320px                      |
 * | 1:1     | square    | 320×320px                       |
 * | 4:3     | landscape | full width, height ~293px       |
 * | 16:9    | landscape | full width, height ~219px       |
 * | 21:9    | ultrawide | full width, height ~167px       |
 */
export const getNaturalMediaFitStyle = (mediaWidth: number, mediaHeight: number) => ({
  aspectRatio: `${mediaWidth} / ${mediaHeight}`,
  width: `min(100%, calc(${NATURAL_MEDIA_MAX_HEIGHT} * ${mediaWidth} / ${mediaHeight}))`,
  maxHeight: NATURAL_MEDIA_MAX_HEIGHT,
});

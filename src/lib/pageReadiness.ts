export interface DecodableImage {
  decode?: () => Promise<void>;
}

const settleDecode = (image: DecodableImage) =>
  image.decode?.().catch(() => undefined) ?? Promise.resolve();

/**
 * Wait only for above-the-fold images. A bounded timeout prevents a slow or
 * broken image from keeping the whole application behind the loader.
 */
export async function waitForCriticalImages(
  images: Iterable<DecodableImage>,
  timeoutMs = 2400,
) {
  const decoding = Promise.all(Array.from(images, settleDecode));
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, Math.max(0, timeoutMs));
  });

  await Promise.race([decoding.then(() => undefined), timeout]);

  if (timeoutId !== undefined) clearTimeout(timeoutId);
}

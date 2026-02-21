export type Awaitable<T> = Promise<T> | T;

export async function disposeOnException<T>(
  disposable: AsyncDisposable,
  cb: () => Promise<T>,
): Promise<T> {
  try {
    return await cb();
  } catch (e) {
    await disposable[Symbol.asyncDispose]();
    throw e;
  }
}

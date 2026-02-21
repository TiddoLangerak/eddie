import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { disposeOnException } from "./async.ts";

describe("disposeOnException", () => {
  it("returns callback result on success", async () => {
    let disposed = false;
    const disposable: AsyncDisposable = {
      async [Symbol.asyncDispose]() {
        disposed = true;
      },
    };

    const result = await disposeOnException(disposable, async () => "success");

    assert.equal(result, "success");
    assert.equal(disposed, false);
  });

  it("disposes and rethrows on exception", async () => {
    let disposed = false;
    const disposable: AsyncDisposable = {
      async [Symbol.asyncDispose]() {
        disposed = true;
      },
    };

    await assert.rejects(
      () =>
        disposeOnException(disposable, async () => {
          throw new Error("test error");
        }),
      /test error/,
    );
    assert.equal(disposed, true);
  });

  it("preserves original error", async () => {
    const disposable: AsyncDisposable = {
      async [Symbol.asyncDispose]() {},
    };
    const originalError = new Error("original");

    try {
      await disposeOnException(disposable, async () => {
        throw originalError;
      });
      assert.fail("should have thrown");
    } catch (e) {
      assert.equal(e, originalError);
    }
  });
});

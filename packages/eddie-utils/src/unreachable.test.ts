import { strict as assert } from "node:assert";
import { test } from "node:test";
import { unreachable } from "./unreachable.ts";

test("unreachable throws an error", () => {
  assert.throws(
    () => {
      unreachable({} as never);
    },
    {
      name: "Error",
      message: "Unreachable code was reached",
    },
  );
});

test("unreachable throws with any input", () => {
  assert.throws(() => unreachable(null as never));
  assert.throws(() => unreachable(undefined as never));
  assert.throws(() => unreachable("test" as never));
});

test("unreachable ensures exhaustiveness at compile time", () => {
  type Color = "red" | "blue" | "green";

  function getColorCode(color: Color): string {
    switch (color) {
      case "red":
        return "#FF0000";
      case "blue":
        return "#0000FF";
      case "green":
        return "#00FF00";
      default:
        return unreachable(color);
    }
  }

  assert.equal(getColorCode("red"), "#FF0000");
  assert.equal(getColorCode("blue"), "#0000FF");
  assert.equal(getColorCode("green"), "#00FF00");
});

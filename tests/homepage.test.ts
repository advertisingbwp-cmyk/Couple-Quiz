import test from "node:test";
import assert from "node:assert/strict";
import { saveCreatorSetup } from "../components/quiz-home/creatorSetup";

test("homepage hands off a trimmed nickname and both wording choices to the creator contract", () => {
  for (const gender of ["male", "female"] as const) {
    const stored = new Map<string, string>();
    assert.equal(
      saveCreatorSetup("  Sara  ", gender, {
        setItem: (key, value) => {
          stored.set(key, value);
        },
      }),
      null,
    );
    assert.deepEqual(
      [...stored],
      [
        ["creator_name", "Sara"],
        ["creator_gender", gender],
      ],
    );
  }
});

test("blank and oversized names do not write session data", () => {
  for (const name of ["", "   ", "a".repeat(31)]) {
    let writes = 0;
    assert.ok(
      saveCreatorSetup(name, "male", {
        setItem() {
          writes++;
        },
      }),
    );
    assert.equal(writes, 0);
  }
});

test("storage rejection on either field prevents a successful handoff and rolls back partial state", () => {
  for (const failAt of [1, 2]) {
    let writes = 0;
    const store = new Map<string, string>();
    const error = saveCreatorSetup("Test friend", "female", {
      setItem(key, value) {
        if (++writes === failAt) throw new Error("Storage blocked");
        store.set(key, value);
      },
      removeItem(key) {
        store.delete(key);
      },
    });
    assert.match(error ?? "", /couldn't save/);
    assert.equal(store.has("creator_name"), false);
    assert.equal(store.has("creator_gender"), false);
  }
});


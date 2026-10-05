import original, * as native from "node:test";

function bounded(fn, timeout) {
  return function (...args) {
    const hook = timeout === 15000;
    const index = hook ? 1 : typeof args[0] === "function" ? 0 : 1;
    const candidate = args[index];
    const hasOptions = candidate !== null && typeof candidate === "object";
    const options = hasOptions ? { ...candidate } : {};
    if (options.timeout !== undefined &&
        (!Number.isInteger(options.timeout) || options.timeout < 1 || options.timeout > timeout)) {
      throw new Error("Failure Gate: disabled, invalid or enlarged test/hook timeout");
    }
    options.timeout ??= timeout;
    // Context-local subtests/hooks must not bypass the same finite defaults.
    const callbackIndex = args.findLastIndex(value => typeof value === "function");
    if (callbackIndex !== -1 && !hook) {
      const callback = args[callbackIndex];
      args[callbackIndex] = function (context, ...rest) {
        if (context && typeof context === "object") {
          for (const name of ["test", "before", "after", "beforeEach", "afterEach"]) {
            if (typeof context[name] === "function") {
              context[name] = bounded(context[name].bind(context), name === "test" ? 30000 : 15000);
            }
          }
        }
        return Reflect.apply(callback, this, [context, ...rest]);
      };
    }
    if (hasOptions) args[index] = options;
    else args.splice(index, 0, options);
    return Reflect.apply(fn, this, args);
  };
}

export const test = bounded(native.test, 30000);
export const it = bounded(native.it, 30000);
export const describe = bounded(native.describe, 30000);
export const suite = bounded(native.suite, 30000);
export const before = bounded(native.before, 15000);
export const after = bounded(native.after, 15000);
export const beforeEach = bounded(native.beforeEach, 15000);
export const afterEach = bounded(native.afterEach, 15000);
export const mock = native.mock;
export const run = native.run;
export const snapshot = native.snapshot;
export const assert = native.assert;

for (const [name, nativeFunction, wrapped] of [
  ["test", native.test, test], ["it", native.it, it],
  ["describe", native.describe, describe], ["suite", native.suite, suite],
]) {
  for (const modifier of ["skip", "todo", "only"]) {
    wrapped[modifier] = bounded(nativeFunction[modifier], 30000);
  }
}

Object.assign(test, { test, it, describe, suite, before, after, beforeEach, afterEach,
                     mock, run, snapshot, assert });
export default test;

import DiffPatcher from "./diffpatcher";
import { Delta, InputData, Options } from "./types";

export { DiffPatcher } from "./diffpatcher";

export * as formatters from "./formatters/index";

export * as console from "./formatters/console";

export * from "./types";

export function create(options?: Options) {
  return new DiffPatcher(options);
}

let defaultInstance;

export function diff(left: InputData, right: InputData) {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.diff(left, right);
}

export function patch(left: InputData, delta: Delta) {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.patch(left, delta);
}

export function unpatch(right: InputData, delta: Delta) {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.unpatch(right, delta);
}

export function reverse(delta: Delta) {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.reverse(delta);
}

export function clone<T>(value: T): T {
  if (!defaultInstance) {
    defaultInstance = new DiffPatcher();
  }
  return defaultInstance.clone(value);
}

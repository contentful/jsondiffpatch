export interface BaseOperation {
  path: string;
}

export interface AddOperation<T = any> extends BaseOperation {
  op: "add";
  value: T;
}

export interface RemoveOperation extends BaseOperation {
  op: "remove";
}

export interface ReplaceOperation<T = any> extends BaseOperation {
  op: "replace";
  value: T;
}

export interface MoveOperation extends BaseOperation {
  op: "move";
  from: string;
}

export interface CopyOperation extends BaseOperation {
  op: "copy";
  from: string;
}

export interface TestOperation<T = any> extends BaseOperation {
  op: "test";
  value: T;
}

export type Operation =
  | AddOperation
  | RemoveOperation
  | ReplaceOperation
  | MoveOperation
  | CopyOperation
  | TestOperation;

export type Patch = Operation[];

export interface Delta {
  [key: string]: any;

  [key: number]: any;
}

/*
export interface JSONPatchFormatter {
  format(delta: Delta | undefined, original?: any): Patch;
}

export interface Formatter {
  format(delta: Delta, original: any): string;
}
 */

export type InputData =
  | Record<string, any>
  | Array<any>
  | string
  | number
  | any;

export type Options = {
  cloneDiffValues?: boolean;
  textDiff?: {
    minLength?: number;
  };
  objectHash?: (...args) => string;
  propertyFilter?: (property: string) => boolean;
  arrays?: {
    detectMove?: boolean;
    includeValueOnMove?: boolean;
  };
};

export interface BaseOperation {
  path: string;
}

export interface AddOperation<T = any> extends BaseOperation{
  op: 'add';
  value: T;
}

export interface RemoveOperation extends BaseOperation{
  op: 'remove';
}

export interface ReplaceOperation<T = any> extends BaseOperation {
  op: 'replace';
  value: T;
}

export interface MoveOperation extends BaseOperation {
  op: 'move';
  from: string;
}

export interface CopyOperation extends BaseOperation {
  op: 'copy';
  from: string;
}
export interface TestOperation<T = any> extends BaseOperation {
  op: 'test';
  value: T;
}

export type Operation = AddOperation | RemoveOperation | ReplaceOperation | MoveOperation | CopyOperation | TestOperation

export type Patch = Operation[]

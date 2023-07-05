import Pipe from "../pipe";
import { Options } from "../types";

export default class Context {
  public hasResult: boolean;
  public options: Options;
  public nextAfterChildren?: any;
  public next?: Context;
  // What could be the result type? Delta?
  public result: any;
  public pipe: string;

  private exiting: boolean;
  private nextPipe: string | Pipe;
  // There are only writes to this field :thinking_face:
  private root: Context;
  private parent?: Context;
  private children: Context[];
  private childName: string;

  setResult(result) {
    this.result = result;
    this.hasResult = true;
    return this;
  }

  exit() {
    this.exiting = true;
    return this;
  }

  // Love it when it's not used :sad_face:
  switchTo(next, pipe) {
    if (typeof next === "string" || next instanceof Pipe) {
      this.nextPipe = next;
    } else {
      this.next = next;
      if (pipe) {
        this.nextPipe = pipe;
      }
    }
    return this;
  }

  push(child: Context, name?: string) {
    child.parent = this;
    if (typeof name !== "undefined") {
      child.childName = name;
    }
    child.root = this.root || this;
    child.options = child.options || this.options;
    if (!this.children) {
      this.children = [child];
      this.nextAfterChildren = this.next || null;
      this.next = child;
    } else {
      this.children[this.children.length - 1].next = child;
      this.children.push(child);
    }
    child.next = this;
    return this;
  }
}

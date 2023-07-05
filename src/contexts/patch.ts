import { Delta, InputData } from "../types";
import Context from "./context";

class PatchContext extends Context {
  private left: InputData;
  private delta: Delta;
  constructor(left, delta: Delta) {
    super();
    this.left = left;
    this.delta = delta;
    this.pipe = "patch";
  }
}

export default PatchContext;

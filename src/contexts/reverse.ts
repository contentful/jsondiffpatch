import { Delta } from "../types";
import Context from "./context";

class ReverseContext extends Context {
  private delta: Delta;
  constructor(delta: Delta) {
    super();
    this.delta = delta;
    this.pipe = "reverse";
  }
}

export default ReverseContext;

import { expect } from "chai";
import { DiffPatcher } from "../src";

describe.only("a Diffpatcher class", () => {
  it("can be initialized without any params", () => {
    const differ = new DiffPatcher();
    expect(differ).to.be.an.instanceof(DiffPatcher);
  });
});

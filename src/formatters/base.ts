import { Delta, InputData } from "../types";

const isArray =
  typeof Array.isArray === "function"
    ? Array.isArray
    : (a) => a instanceof Array;

const getObjectKeys =
  typeof Object.keys === "function"
    ? (obj) => Object.keys(obj)
    : (obj) => {
        const names = [];
        for (let property in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, property)) {
            names.push(property);
          }
        }
        return names;
      };

const trimUnderscore = (str: string): string => {
  if (str.substr(0, 1) === "_") {
    return str.slice(1);
  }
  return str;
};

const arrayKeyToSortNumber = (key: string): number => {
  if (key === "_t") {
    return -1;
  } else {
    if (key.substr(0, 1) === "_") {
      return parseInt(key.slice(1), 10);
    } else {
      return parseInt(key, 10) + 0.1;
    }
  }
};

const arrayKeyComparer = (key1: string, key2: string) =>
  arrayKeyToSortNumber(key1) - arrayKeyToSortNumber(key2);

class BaseFormatter {
  protected includeMoveDestinations?: boolean;
  format(delta?: Delta, left?: InputData) {
    const context = {};
    this.prepareContext(context);
    this.recurse(context, delta, left);
    return this.finalize(context);
  }

  prepareContext(context) {
    context.buffer = [];
    context.out = function (...args) {
      this.buffer.push(...args);
    };
  }

  typeFormatterNotFound(context, deltaType) {
    throw new Error(`cannot format delta type: ${deltaType}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  typeFormatterErrorFormatter(context, err, ...rest) {
    return err.toString();
  }

  finalize({ buffer }: any) {
    if (isArray(buffer)) {
      return buffer.join("");
    }
  }

  recurse(
    context: any,
    delta?: Delta,
    left?: InputData,
    key?: any,
    leftKey?: any,
    movedFrom?: any,
    isLast?: boolean
  ) {
    const useMoveOriginHere = delta && movedFrom;
    const leftValue = useMoveOriginHere ? movedFrom.value : left;

    if (typeof delta === "undefined" && typeof key === "undefined") {
      return undefined;
    }

    const type = this.getDeltaType(delta, movedFrom);
    const nodeType =
      type === "node" ? (delta._t === "a" ? "array" : "object") : "";

    if (typeof key !== "undefined") {
      this.nodeBegin(context, key, leftKey, type, nodeType, isLast);
    } else {
      this.rootBegin(context, type, nodeType);
    }

    let typeFormatter;
    try {
      typeFormatter =
        this[`format_${type}`] || this.typeFormatterNotFound(context, type);
      typeFormatter.call(
        this,
        context,
        delta,
        leftValue,
        key,
        leftKey,
        movedFrom
      );
    } catch (err) {
      this.typeFormatterErrorFormatter(
        context,
        err,
        delta,
        leftValue,
        key,
        leftKey,
        movedFrom
      );
      if (typeof console !== "undefined" && console.error) {
        console.error(err.stack);
      }
    }

    if (typeof key !== "undefined") {
      this.nodeEnd(context, key, leftKey, type, nodeType, isLast);
    } else {
      this.rootEnd(context, type, nodeType);
    }
  }

  formatDeltaChildren(context, delta, left) {
    const self = this;
    this.forEachDeltaKey(delta, left, (key, leftKey, movedFrom, isLast) => {
      self.recurse(
        context,
        delta[key],
        left ? left[leftKey] : undefined,
        key,
        leftKey,
        movedFrom,
        isLast
      );
    });
  }

  forEachDeltaKey(delta, left, fn) {
    const keys = getObjectKeys(delta);
    const arrayKeys = delta._t === "a";
    const moveDestinations = {};
    let name;
    if (typeof left !== "undefined") {
      for (name in left) {
        if (Object.prototype.hasOwnProperty.call(left, name)) {
          if (
            typeof delta[name] === "undefined" &&
            (!arrayKeys || typeof delta[`_${name}`] === "undefined")
          ) {
            keys.push(name);
          }
        }
      }
    }
    // look for move destinations
    for (name in delta) {
      if (Object.prototype.hasOwnProperty.call(delta, name)) {
        const value = delta[name];
        if (isArray(value) && value[2] === 3) {
          moveDestinations[value[1].toString()] = {
            key: name,
            value: left && left[parseInt(name.substr(1))],
          };
          if (this.includeMoveDestinations !== false) {
            if (
              typeof left === "undefined" &&
              typeof delta[value[1]] === "undefined"
            ) {
              keys.push(value[1].toString());
            }
          }
        }
      }
    }
    if (arrayKeys) {
      keys.sort(arrayKeyComparer);
    } else {
      keys.sort();
    }
    for (let index = 0, length = keys.length; index < length; index++) {
      const key = keys[index];
      if (arrayKeys && key === "_t") {
        continue;
      }
      const leftKey = arrayKeys
        ? typeof key === "number"
          ? key
          : parseInt(trimUnderscore(key), 10)
        : key;
      const isLast = index === length - 1;
      fn(key, leftKey, moveDestinations[leftKey], isLast);
    }
  }

  getDeltaType(delta, movedFrom) {
    if (typeof delta === "undefined") {
      if (typeof movedFrom !== "undefined") {
        return "movedestination";
      }
      return "unchanged";
    }
    if (isArray(delta)) {
      if (delta.length === 1) {
        return "added";
      }
      if (delta.length === 2) {
        return "modified";
      }
      if (delta.length === 3 && delta[2] === 0) {
        return "deleted";
      }
      if (delta.length === 3 && delta[2] === 2) {
        return "textdiff";
      }
      if (delta.length === 3 && delta[2] === 3) {
        return "moved";
      }
    } else if (typeof delta === "object") {
      return "node";
    }
    return "unknown";
  }

  parseTextDiff(value) {
    const output = [];
    const lines = value.split("\n@@ ");
    for (let i = 0, l = lines.length; i < l; i++) {
      const line = lines[i];
      const lineOutput = {
        pieces: [],
      };
      const location = /^(?:@@ )?[-+]?(\d+),(\d+)/.exec(line).slice(1);
      // @ts-ignore
      lineOutput.location = {
        line: location[0],
        chr: location[1],
      };
      const pieces = line.split("\n").slice(1);
      for (
        let pieceIndex = 0, piecesLength = pieces.length;
        pieceIndex < piecesLength;
        pieceIndex++
      ) {
        const piece = pieces[pieceIndex];
        if (!piece.length) {
          continue;
        }
        const pieceOutput = {
          type: "context",
        };
        if (piece.substr(0, 1) === "+") {
          pieceOutput.type = "added";
        } else if (piece.substr(0, 1) === "-") {
          pieceOutput.type = "deleted";
        }
        // @ts-ignore
        pieceOutput.text = piece.slice(1);
        lineOutput.pieces.push(pieceOutput);
      }
      output.push(lineOutput);
    }
    return output;
  }

  protected nodeBegin(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    key: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    leftKey: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nodeType: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isLast: boolean
  ) {
    throw new Error("::nodeBegin Not implemented!");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected rootBegin(context: any, type: string, nodeType: string) {
    throw new Error("::rootBegin Not implemented!");
  }

  protected nodeEnd(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    key: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    leftKey: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nodeType: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isLast: boolean
  ) {
    throw new Error("::nodeEnd Not implemented!");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected rootEnd(context: any, type: string, nodeType: string) {
    throw new Error("::rootEnd Not implemented!");
  }
}

export default BaseFormatter;

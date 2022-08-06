import { TypeNode } from "typescript";
import * as fs from "fs";
import { IBuiltinDocs } from "./types";
import {
  typeNodes,
  getArrayTypeNode,
  checkParamType,
  getRecordTypeNode,
  getArrayTypeNodeWithValues,
  getDictNode,
  ETSType,
  ParamData,
} from "../ts";
/**
 * The type mapping between neovim types(lower case) and TypeScript(Lua) type.
 */
export const NVIM_TYPE_MAP: Record<string, () => TypeNode> = {
  number: typeNodes[ETSType.Number],
  integer: typeNodes[ETSType.Number],
  float: typeNodes[ETSType.Number],
  string: typeNodes[ETSType.String],
  boolean: typeNodes[ETSType.Boolean],
  array: typeNodes[ETSType.UnknownArray],
  list: typeNodes[ETSType.UnknownArray],
  dict: typeNodes[ETSType.Record],
  dictionary: typeNodes[ETSType.Record],
  object: typeNodes[ETSType.Record],
  buffer: typeNodes[ETSType.Number],
  window: typeNodes[ETSType.Number],
  tabpage: typeNodes[ETSType.Number],
  void: typeNodes[ETSType.Void],
  luaref: typeNodes[ETSType.Unknown],
  "": typeNodes[ETSType.Unknown],
  funcref: typeNodes[ETSType.Function],
  /**
   * A Blob mostly behaves like a |List| of numbers,
   * where each number has the value of an 8-bit byte, from 0 to 255.
   */
  blob: () => getArrayTypeNode(typeNodes[ETSType.Number]()),

  any: typeNodes[ETSType.Any],
  // @TODO: check for these types
  error: typeNodes[ETSType.Unknown],
};

interface IContainerMap {
  one: (param: ParamData) => TypeNode;
  multi?: (...param: ParamData[]) => TypeNode;
}
export const NVIM_CONTAINER_TYPE_MAP: Record<string, IContainerMap> = {
  Dict: {
    one: getDictNode,
  },
  ArrayOf: {
    one: checkParamType(getArrayTypeNode),
    multi: getArrayTypeNodeWithValues,
  },
  DictionaryOf: { one: checkParamType(getRecordTypeNode) },
};

export type NVIM_TYPE_MAP = typeof NVIM_TYPE_MAP;

/** data in builtin-docs.json */
export const builtinData = JSON.parse(
  fs.readFileSync("./data/builtin-docs.json", { encoding: "utf-8" })
) as IBuiltinDocs;

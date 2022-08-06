import { factory, TypeNode, Node } from "typescript";
import * as fs from "fs";
import {
  typeNodes,
  checkParamType,
  getRecordTypeNode,
  getArrayTypeNode,
  getArrayTypeNodeWithValues,
  getInterfaceNode,
  getDictNode,
	ETSType,
} from "./ts";
import { attachInlineJSDoc2Node, getImportNode } from "./ts";
import { IBuiltinDocs, ParamData } from "./types";
import { isNumeric } from "./utils";

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

/** convert base types, may inclue string of integer */
export const convertTypeDirectly = (
  type: string,
  allowUnknownString: boolean = false
): TypeNode | string => {
  type = type.toLowerCase();
  if (!(type in NVIM_TYPE_MAP)) {
    if (isNumeric(type)) {
      // return string of number
      return type;
    }
    if (allowUnknownString) {
      return type;
    }
    console.log("Unknown type name detected: " + type);
    return typeNodes.unknown();
  }
  return NVIM_TYPE_MAP[type]();
};

/** process comma ',' separated parameters */
export const processParams = (
  params: string,
  allowUnknownString: boolean = false
): ParamData[] => {
  if (params.includes(",")) {
    // multiple parameters
    const parameters = params.split(",").map((param) => param.trim());
    return parameters.map((param) => convertTypeDirectly(param));
  } else {
    // one parameter
    return [convertTypeDirectly(params, allowUnknownString)];
  }
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

export enum Modules {
  API = "api",
  LUA = "lua",
  LSP = "lsp",
  TREESITTER = "treesitter",
  DIAGNOSTIC = "diagnostic",
}
export const moduleList = [
  Modules.API,
  Modules.LUA,
  Modules.LSP,
  Modules.TREESITTER,
  Modules.DIAGNOSTIC,
];

/** Get mpack file path for a module */
export const mod2MpackPath = (mod: string) => `./data/${mod}.mpack`;
/** Get ts definition file path for a module */
export const mod2DefFilePath = (mod: string) => `./types/${mod}.d.ts`;

export const headAstNodes: Node[] = [
  factory.createJSDocComment(
    factory.createNodeArray([
      factory.createJSDocText(
        "This is automatically generated file. Do not modify this file manually."
      ),
    ])
  ),
  getImportNode({
    kind: "import",
    names: ["INvimFloatWinConfig"],
    modulePath: "./utils",
  }),
];
attachInlineJSDoc2Node(headAstNodes[0], ["@noResolution", "@noSelfInFile"]);

/** data in builtin-docs.json */
export const builtinData = JSON.parse(
  fs.readFileSync("./data/builtin-docs.json", { encoding: "utf-8" })
) as IBuiltinDocs;

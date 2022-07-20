import { factory, TypeNode, Node } from 'typescript';
import {
  typeNodes,
  checkParamType,
  getRecordTypeNode,
  getArrayTypeNode,
  getArrayTypeNodeWithValues,
  isNumeric,
  getInterfaceNode,
  getDictNode,
} from "./ts-types";
import { getImportNode } from "./ts";
import { ParamData } from './types';

/**
 * The type mapping between `nvim --api-info` and TypeScript type.
 */
export const NVIM_TYPE_MAP: Record<string, () => TypeNode> = {
  Number: typeNodes.number,
  Integer: typeNodes.number,
  Float: typeNodes.number,
  String: typeNodes.string,
  Boolean: typeNodes.boolean,
  Array: typeNodes.unknownArray,
  List: typeNodes.unknownArray,
  Dict: typeNodes.record,
  Dictionary: typeNodes.record,
  Object: typeNodes.record,
  Buffer: typeNodes.number,
  Window: typeNodes.number,
  Tabpage: typeNodes.number,
  void: typeNodes.void,
  LuaRef: typeNodes.unknown,
  "": typeNodes.unknown,
  Funcref: typeNodes.function,
  /**
   * A Blob mostly behaves like a |List| of numbers,
   * where each number has the value of an 8-bit byte, from 0 to 255.
   */
  Blob: () => getArrayTypeNode(typeNodes.number()),

  any: typeNodes.any,
  Any: typeNodes.any,
  // @TODO: check for these types
  Error: typeNodes.unknown,
};

/** convert base types, may inclue string of integer */
export const convertTypeDirectly = (type: string, allowUnknownString: boolean = false): TypeNode | string => {
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
export const processParams = (params: string, allowUnknownString: boolean = false): ParamData[] => {
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
  ArrayOf: { one: checkParamType(getArrayTypeNode), multi: getArrayTypeNodeWithValues },
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
  factory.createJSDocComment(undefined, [
    factory.createJSDocReturnTag(factory.createIdentifier("noResolution")),
    factory.createJSDocReturnTag(factory.createIdentifier("noSelfInFile")),
  ]),
  getImportNode({
    kind: "import",
    names: ["INvimFloatWinConfig"],
    modulePath: "./utils",
  }),
];

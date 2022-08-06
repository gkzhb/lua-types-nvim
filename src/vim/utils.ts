import { TypeNode } from "typescript";
import { isNumeric } from "../utils";
import { typeNodes, ParamData } from "../ts";
import { NVIM_TYPE_MAP, NVIM_CONTAINER_TYPE_MAP } from "./constants";

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

/** Process generic type string */
export const extractTypeContainer = (
  type: string
): { container: string | null; t: string } => {
  if (!type.endsWith(")")) {
    return {
      container: null,
      t: type,
    };
  } else {
    const leftBracketIdx = type.indexOf("(");
    const container = type.slice(0, leftBracketIdx);
    const t = type.slice(leftBracketIdx + 1, type.length - 1).trim();
    return { container, t };
  }
};

/** Convert vim types from neovim msgpack to TypeScript Type AST node */
export const convertType = (
  vimType: string
): { type: TypeNode; optional: boolean } => {
  if (vimType.length === 0) {
    return {
      type: typeNodes.unknown(),
      optional: false,
    };
  }
  let type = vimType.slice();
  let optional = false;
  if (type.endsWith("*")) {
    // remove ending star '*'
    // star indicates the parameter is optional? @TODO: verify this
    optional = true;
    type = type.slice(0, type.length - 1).trim();
  }
  const result = extractTypeContainer(type);
  let finalType: TypeNode = typeNodes.unknown();
  if (result.container) {
    // container exists
    if (result.container in NVIM_CONTAINER_TYPE_MAP) {
      // container matches from map
      const params = processParams(result.t, result.container === "Dict");
      const typeMapVal = NVIM_CONTAINER_TYPE_MAP[result.container];
      if (params.length > 1) {
        // multiple parameters
        if (typeMapVal.multi) {
          finalType = typeMapVal.multi(...params);
        } else {
          // not set for multi parameters
          const message = `multi parameter for container ${result.container}: ${result.t}`;
          console.log(message);
        }
      } else {
        // only one parameter
        finalType = typeMapVal.one(params[0]);
      }
    } else {
      // container not found
      const message = `container ${result.container} not found`;
      console.log(message);
    }
  } else {
    const temp = convertTypeDirectly(type);
    if (typeof temp === "string") {
      console.error(`invalid type ${temp} from ${type}`);
    } else {
      finalType = temp;
    }
  }
  return {
    type: finalType!,
    optional,
  };
};

/** whether this method is from an object property */
export const checkFunctionObjectProperty = (fname: string): boolean => {
  return fname.includes(":");
};

export const processDocLines = (docs: string[]) => {
  const comments: string[] = [];
  for (let doc of docs) {
    // prevent '*/' ends multiline comments
    doc = doc.replace(/\*\//g, "*\\/");
    comments.push(...doc.split("\n"));
  }
  return comments;
};

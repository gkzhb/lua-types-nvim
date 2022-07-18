import { factory, KeywordTypeSyntaxKind, SyntaxKind, TypeNode } from "typescript";
import {
  Modules,
  convertTypeDirectly,
  NVIM_CONTAINER_TYPE_MAP,
  processParams,
} from "./constants";
import { IApiFunction, IFunction, IParameter } from "./types";
import { typeNodes } from './ts-types';

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

/**
 * Convert IApiFunction to IFunction
 */
export const convertFunction = (
  fname: string,
  f: IApiFunction,
  mod: Record<string, Record<string, IApiFunction> | undefined>
): { node: IFunction, comments: string[] } | null => {
  if (checkFunctionObjectProperty(fname)) {
    // process treesitter lua object properties
    // add property to `mod`
    const divideIdx = fname.indexOf(":");
    const prop = fname.slice(0, divideIdx);
    const newFuncName = fname.slice(divideIdx + 1);
    if (!mod[prop]) {
      mod[prop] = {};
    }
    mod[prop]![newFuncName] = f;
    return null;
  }

  const parametersExist =
    f.parameters.length &&
    !(f.parameters.length === 1 && f.parameters[0][0] === "void");
  const node: IFunction = {
    kind: "function",
    parameters: [] as IParameter[],
    return: factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
  };
  if (parametersExist) {
    if (f.parameters[0][1] === "self") {
      // convert 'self' parameter to `this: any`
      f.parameters[0] = ["Any", "this"];
    }
    const paramLen = f.parameters.length;
    if (f.parameters[paramLen - 1][1] === "...") {
      // deal with remaining parameters
      f.parameters[paramLen - 1] = [
        `ArrayOf(${f.parameters[paramLen - 1][0]})`,
        "...args",
      ];
    }
    f.parameters.forEach(([type, name]) => {
      const result = convertType(type);
      // console.log('param type func ', fname, result , type);
      const temp: IParameter = {
        kind: 'parameter',
        id: name,
        optional: result.optional,
        type: result.type,
      };
      node.parameters.push(temp);
    });
  }

  // Generate TSDoc comments for the API
  const docs: string[] = [];
  docs.push(...f.doc);
  for (const param in f.parameters_doc) {
    docs.push(`@param ${param} ${f.parameters_doc[param]}`);
  }
  if (f.return.length) {
    docs.push(`@returns ${f.return[0]}`);
    docs.push(...f.return.slice(1));
  }

  if (f.signature.length) {
    docs.push(`@signature \`${f.signature}\``);
  }

  if (f.annotations.length) {
    docs.push(`@annotations ${f.annotations[0]}`);
    docs.push(...f.annotations.slice(1));
  }

  if (f.seealso.length) {
    docs.push(`@reference ${f.seealso[0]}`);
    docs.push(...f.seealso.slice(1));
  }
  const comments: string[] = [];
  for (const doc of docs ){
    comments.push(...doc.split('\n'));
  }
  return { node, comments };
};

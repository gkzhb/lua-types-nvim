import { Modules, convertTypeDirectly, NVIM_TYPE_MAP, NVIM_CONTAINER_TYPE_MAP, processParams, tsTypes } from './constants';
import { IApiFunction } from './types';

/** Process generic type string */
export const extractTypeContainer = (type: string): { container: string | null, t: string } => {
if (!type.endsWith(')')) {
    return {
      container: null,
      t: type,
    };
  } else {
    const leftBracketIdx = type.indexOf('(');
    const container = type.slice(0, leftBracketIdx);
    const t = type.slice(leftBracketIdx + 1, type.length - 1).trim();
    return { container, t };
  }
}

/** Convert vim types from neovim msgpack to tslua types */
export const convertType = (vimType: string): { type: string, optional: boolean } => {
  let type = vimType.slice();
  let optional = false;
  if (type.endsWith('*')) {
    // remove ending star '*'
    // star indicates the parameter is optional? @TODO: verify this
    optional = true;
    type = type.slice(0, type.length - 1).trim();
  }
  const result = extractTypeContainer(type);
  let finalType = '';
  if (result.container) {
    // container exists
    if (result.container in NVIM_CONTAINER_TYPE_MAP) {
      // container matches from map
      const params = processParams(result.t);
      const typeMapVal = NVIM_CONTAINER_TYPE_MAP[result.container];
      if (params.length > 1) {
        // multiple parameters
        if (typeMapVal.multi) {
          finalType = typeMapVal.multi(...params);
        } else {
          // not set for multi parameters
          const message = `multi parameter for container ${result.container}: ${result.t}`;
          console.log(message);
          finalType = `${tsTypes.unknown} /* ${message} */`;
        }
      } else {
        // only one parameter
        finalType = typeMapVal.one(params[0]);
      }
    } else {
      // container not found
      const message = `container ${result.container} not found`;
      console.log(message);
      finalType = `${tsTypes.unknown} /* ${message} */`;
    }
  } else {
    finalType = convertTypeDirectly(type);
  }
  return {
    type: finalType,
    optional,
  };
};

export const getIndentString = (indentLevel: number, indentSize: number = 2) => ' '.repeat(indentSize * indentLevel);

/**
 * Parse string list to jsdoc docstring
* @param content string list to be parsed
* @param indent indent level for docstring
* @param indentSize how many spaces for an indent level
 */
export const parseContentInDocstring = (content: string[], indent: number = 1, indentSize: number = 2) => {
  const newContent: string[] = [];
  const indentStr = getIndentString(indent, indentSize);
  content.forEach(item => {
    // item may contain newline chars, redivide lines
    const lines = item.split('\n');
    lines.forEach(line => {
      const trimLine = line.trimEnd();
      if (trimLine.length) {
        newContent.push(trimLine);
      }
    });
  });
  const midLines = newContent.join(`\n${indentStr} * `);
  return `${indentStr}/**
${indentStr} * ${midLines}
${indentStr} */
`;
}

export const checkFunctionObjectProperty = (fname: string): boolean => {
  if (fname.includes(':')) {
    return true;
  }
  return false;
}

/**
 * Convert a function from msgpack to tslua type
 *
 * @param fname function name
 */
export const convertFunction2TypeDef = (
  fname: string,
  f: IApiFunction,
  mod: Record<string, Record<string, IApiFunction> | undefined>,
  indentLevel: number = 1,
): string => {
  const parametersExist =
    f.parameters.length &&
    !(f.parameters.length === 1 && f.parameters[0][0] === "void");
  let parameters = ""; // function has no parameters
  if (parametersExist) {
    if (f.parameters[0][1] === "self") {
      // convert 'self' parameter to `this: any`
      f.parameters[0] = ["Any", "this"];
    }
    const paramLen = f.parameters.length;
    if (f.parameters[paramLen - 1][1] === "...") {
      // deal with remaining parameters
      f.parameters[paramLen - 1] = [`ArrayOf(${f.parameters[paramLen - 1][0]})`, "...args"];
    }
    parameters = f.parameters
      .map(([type, name]) => {
        const result = convertType(type);
        return `${name}${result.optional ? "?" : ""}: ${result.type}`;
      })
      .join(", ");
  }

  if (checkFunctionObjectProperty(fname)) {
    // process treesitter lua object properties
    // add property to `mod`
    const divideIdx = fname.indexOf(':');
    const prop = fname.slice(0, divideIdx);
    const newFuncName = fname.slice(divideIdx + 1);
    if (!mod[prop]) {
      mod[prop] = {};
    }
    mod[prop]![newFuncName] = f;
    return '';
  }

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

  // We can't get return type from mpack yet
  const returnType = "void";
  return (
    (docs.length ? parseContentInDocstring(docs, indentLevel) : "") +
    `${'  '.repeat(indentLevel)}${fname}: (${parameters}) => ${returnType};`
  );
};

/** Get mpack file path for a module */
export const mod2MpackPath = (mod: string) => `./data/${mod}.mpack`;
/** Get ts definition file path for a module */
export const mod2DefFilePath = (mod: string) => `./types/${mod}.d.ts`;

const getModTemplate = (mod: Modules) => {
  const modName = mod.charAt(0).toUpperCase() + mod.slice(1);
return (
    functions: string[]
  ) => `/** Automatically generated file. Do not manually modify this file. */
/** @noResolution */
/** @noSelfInFile */

import { INvimFloatWinConfig } from './utils';
export declare interface ${modName} {
${functions.join("\n\n")}
}`
};
/** Concat function definition strings and generate ts definition file content */
export const modTemplates: Record<Modules, (funcs: string[]) => string> = {
  [Modules.API]: getModTemplate(Modules.API),
  [Modules.LUA]: getModTemplate(Modules.LUA),
  [Modules.LSP]: getModTemplate(Modules.LSP),
  [Modules.TREESITTER]: getModTemplate(Modules.TREESITTER),
  [Modules.DIAGNOSTIC]: getModTemplate(Modules.DIAGNOSTIC),
};

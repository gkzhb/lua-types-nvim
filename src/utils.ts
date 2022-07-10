import { convertTypeDirectly, NVIM_TYPE_MAP, NVIM_CONTAINER_TYPE_MAP, processParams, tsTypes } from './constants';
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
export const convertType = (vimType: string): string => {
  let type = vimType.slice();
  if (type.endsWith('*')) {
    // remove ending star '*'
    type = type.slice(0, type.length - 1).trim();
  }
  const result = extractTypeContainer(type);
  if (result.container) {
    // container exists
    if (result.container in NVIM_CONTAINER_TYPE_MAP) {
      // container matches from map
      const params = processParams(result.t);
      const typeMapVal = NVIM_CONTAINER_TYPE_MAP[result.container];
      if (params.length > 1) {
        // multiple parameters
        if (typeMapVal.multi) {
          return typeMapVal.multi(...params);
        } else {
          // not set for multi parameters
          const message = `multi parameter for container ${result.container}: ${result.t}`;
          console.log(message);
          return `${tsTypes.unknown} /* ${message} */`;
        }
      } else {
        // only one parameter
        return typeMapVal.one(params[0]);
      }
    } else {
      // container not found
      const message = `container ${result.container} not found`;
      console.log(message);
      return `${tsTypes.unknown} /* ${message} */`;
    }
  } else {
    return convertTypeDirectly(type);
  }
};

/**
 * Parse string list to jsdoc docstring
* @param content string list to be parsed
* @param indent indent level for docstring
* @param indentSize how many spaces for an indent level
 */
export const parseContentInDocstring = (content: string[], indent: number = 1, indentSize: number = 2) => {
  const newContent: string[] = [];
  const indentStr = ' '.repeat(indent).repeat(indentSize);
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

/**
 * Convert a function from msgpack to tslua type
 *
 * @param fname function name
 */
export const convertFunction2TypeDef = (fname: string, f: IApiFunction): string => {
  const parameters =
    f.parameters.length === 1 && f.parameters[0][0] === "void"
      ? "" // function has no parameters
      : f.parameters
          .map(([type, name]) => `${name}: ${convertType(type)}`)
          .join(", ");
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
  const returnType = 'void';
  return (
    (docs.length ? parseContentInDocstring(docs) : "") +
    `  ${fname}: (${parameters}) => ${returnType};`
  );
};

/** Get mpack file path for a module */
export const mod2MpackPath = (mod: string) => `./data/${mod}.mpack`;
/** Get ts definition file path for a module */
export const mod2DefFilePath = (mod: string) => `./types/${mod}.d.ts`;

/** Concat function definition strings and generate ts definition file content */
export const apiModTemplate = (functions: string[]) => `/** Automatically generated file. Do not manually modify this file. */
/** @noResolution */
/** @noSelfInFile */

import { INvimFloatWinConfig } from './utils';
export declare interface Api {
${functions.join('\n\n')}
}`;

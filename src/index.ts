import { decode } from '@msgpack/msgpack';
import { moduleList, Modules } from "./constants";
import * as fs from 'fs';

import { NvimApiFunctions, IApiFunction } from './types';
import { convertFunction2TypeDef, getIndentString, mod2DefFilePath, mod2MpackPath, modTemplates } from './utils';

export type LuaObjectMethodsMap = Record<string, NvimApiFunctions | undefined>;

export const processLuaObjectProps = (mod: LuaObjectMethodsMap, indentLevel: number = 1) => {
  const content: string[] = [];
  const indentStr = getIndentString(indentLevel, 2);
  // one more indent
  const indentPlus = indentStr + '  ';
  for (const prop in mod) {
    if (mod[prop]) {
      // process object property `prop`'s methods
      const subMod: LuaObjectMethodsMap = {};
      const results = processApiFunctions(mod[prop]!, indentLevel + 1);
      const result = results.join(`\n${indentPlus}`);
      // one prop string
      const propString = `${indentStr}${prop}: {
${indentPlus}${result}
${indentStr}};`;
      content.push(propString);
    }
  }
  return content;
};

export const processApiFunctions = (obj: NvimApiFunctions, indentLevel: number = 1) => {
  const mod: LuaObjectMethodsMap = {};
  const functions: string[] = [];
  for (const fname in obj) {
    const func = convertFunction2TypeDef(fname, obj[fname], mod, indentLevel);
    if (func.length) {
      functions.push(func);
    }
  }
  // process lua object properties stored in `mod`
  const props = processLuaObjectProps(mod);
  functions.push(...props);
  return functions;
}
export const writeFile = (fileName: string, content: string) => {
  try {
    fs.writeFileSync(fileName, content);
  } catch (err) {
    console.error('write error', err);
  }
}

export const processMod = (mod: Modules) => {
  // if (!(mod in Modules)) {
  //   console.warn(`${mod} not in Modules`);
  //   return;
  // }
  const file = fs.readFileSync(mod2MpackPath(mod));
  const result = decode(file) as NvimApiFunctions;
  const func = processApiFunctions(result);
  const content = modTemplates[mod]?.(func);
  if (content) {
    writeFile(mod2DefFilePath(mod), content)
  } else {
    console.warn(`Empty content for ${mod} module.`);
  }
}

for (const mod of moduleList) {
  console.log(`=== start process module ${mod} ===`);
  processMod(mod);
}

import { decode } from '@msgpack/msgpack';
import {
  headAstNodes,
  mod2DefFilePath,
  mod2MpackPath,
  moduleList,
  Modules,
} from "./constants";
import * as fs from 'fs';

import {
  NvimApiFunctions,
  IApiFunction,
  LuaObjectPropMap,
  IProp,
  ILiteralType,
  IInterface,
} from "./types";
import { convertFunction } from "./utils";
import { ModifierSyntaxKind, SyntaxKind } from "typescript";
import * as ts from 'typescript';
import { getInterface } from "./ts";

/** process all methods with object namespace, like 'treesitter:get_node' */
export const processLuaObjectProps = (mod: LuaObjectPropMap) => {
  const props: Record<string, IProp> = {};
  for (const prop in mod) {
    if (mod[prop]) {
      const result = processApis(mod[prop]!);
      // a property
      const propType: IProp = {
        kind: 'property',
        id: prop,
        type: result,
        comments: [],
      };
      props[prop] = propType;
    }
  }
  return props;
};

/** process methods in property */
export const processApis = (obj: NvimApiFunctions): ILiteralType => {
  const node: ILiteralType = {
    kind: 'literalType',
    props: {},
  };
  const mod: LuaObjectPropMap = {};

  for (const fname in obj) {
    const func = convertFunction(fname, obj[fname], mod);
    if (func) {
      const propNode: IProp = {
        kind: 'property',
        id: fname,
        type: func.node,
        comments: func.comments,
      }
      node.props[fname] = propNode;
    }
  }
  // process lua object properties stored in `mod`
  const props = processLuaObjectProps(mod);
  node.props = {
    ...node.props,
    ...props,
  }
  return node;
};

export const processApiFunctions = (obj: NvimApiFunctions, module: string, modifiers: ModifierSyntaxKind[]): IInterface => {
  const node: IInterface = {
    kind: 'interface',
    props: {},
    id: module,
    modifiers,
  };
  const mod: LuaObjectPropMap = {};
  for (const fname in obj) {
    const func = convertFunction(fname, obj[fname], mod);
    if (func) {
      const propNode: IProp = {
        kind: 'property',
        id: fname,
        type: func.node,
        comments: func.comments,
      }
      node.props[fname] = propNode;
    }
  }
  // process lua object properties stored in `mod`
  const props = processLuaObjectProps(mod);
  node.props = {
    ...node.props,
    ...props,
  }
  return node;
};

export const writeFile = (fileName: string, content: string) => {
  try {
    fs.writeFileSync(fileName, content);
  } catch (err) {
    console.error('write error', err);
  }
}

export const processMod = (mod: Modules) => {
  const file = fs.readFileSync(mod2MpackPath(mod));
  const result = decode(file) as NvimApiFunctions;
  const modName = mod.charAt(0).toUpperCase() + mod.slice(1);
  const interfaceNode = processApiFunctions(result, modName, [SyntaxKind.ExportKeyword]);

  const targetFilePath = mod2DefFilePath(mod);
  const resultFile = ts.createSourceFile(targetFilePath, "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const content: string[] = [];
  const astData = headAstNodes.slice();
  astData.push(getInterface(interfaceNode));
  for (const node of astData) {
    content.push(printer.printNode(ts.EmitHint.Unspecified, node, resultFile));
  }

  if (content.length) {
    writeFile(targetFilePath, content.join('\n'));
  } else {
    console.warn(`Empty content for ${mod} module.`);
  }
}

for (const mod of moduleList) {
  console.log(`=== start process module ${mod} ===`);
  processMod(mod);
}

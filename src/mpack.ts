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
  LuaObjectPropMap,
  IProp,
  ILiteralType,
  IInterface,
  NvimCliApiFunctions,
  ICliFunction,
  IFunction,
} from "./types";
import { convertFunction, convertType } from "./utils";
import { ModifierSyntaxKind, SyntaxKind } from "typescript";
import * as ts from 'typescript';
import { attachInlineJSDoc2Node, getInterface } from "./ts";

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

export const updateApiASTNodes = (node: IInterface, functions: ICliFunction[]) => {
  const addNvimPrefix = (str: string) => `nvim_${str}`;
  for (const func of functions) {
    if (!(func.name in node.props)) {
      const newName = addNvimPrefix(func.name);
      if (!(newName in node.props)) {
        console.log(`"${func.name}" is not in API`);
        continue;
      }
      func.name = newName;
    }
    // Api exists in AST
    const f = node.props[func.name].type;
    if (f.kind === 'function') {
      // f is function
      if (func.parameters.length > f.parameters.length) {
        // mismatch API length
        console.log(`${func.name} parameters length issue`, func.parameters, f.parameters);
      } else {
        for (let i = 0; i < func.parameters.length; i++) {
          if (func.parameters[i][1] !== f.parameters[i].id) {
            console.log(`${func.name} parameter name mismatches ${func.parameters[i][1]} ${f.parameters[i].id}`);
          }
          const newType = convertType(func.parameters[i][0]);
          f.parameters[i].type = newType.type;
        }
        f.return = convertType(func.return_type).type;
      }
    } else {
      // f is LiteralType
      console.log(`${func.name} is not a function`);
    }
  }
};

/** output AST to TS file */
export const writeTSFile = (targetFilePath: string, nodes: ts.Node[]) => {
  const resultFile = ts.createSourceFile(targetFilePath, "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const content: string[] = [];
  for (const node of nodes) {
    content.push(printer.printNode(ts.EmitHint.Unspecified, node, resultFile));
  }

  if (content.length) {
    writeFile(targetFilePath, content.join('\n'));
  } else {
    console.warn(`Empty content for ${targetFilePath}.`);
  }
};
export const processMod = (mod: Modules) => {
  const file = fs.readFileSync(mod2MpackPath(mod));
  const result = decode(file) as NvimApiFunctions;
  const modName = mod.charAt(0).toUpperCase() + mod.slice(1);
  const interfaceNode = processApiFunctions(result, modName, [SyntaxKind.ExportKeyword]);

  if (mod === Modules.API) {
    console.log('== process API with cli mpack data ==');
    const cliApiContent = fs.readFileSync(mod2MpackPath('builtin-api'));
    const cliData = decode(cliApiContent) as NvimCliApiFunctions;
    updateApiASTNodes(interfaceNode, cliData.functions);
  }

  const targetFilePath = mod2DefFilePath(mod);
  const astData = headAstNodes.slice();
  const interfaceASTNode = getInterface(interfaceNode);
  attachInlineJSDoc2Node(interfaceASTNode, ['@noSelf']);
  astData.push(interfaceASTNode);
  writeTSFile(targetFilePath, astData);
}

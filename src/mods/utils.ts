import * as fs from "fs";
import { factory, ModifierSyntaxKind, SyntaxKind } from "typescript";
import { decode } from "@msgpack/msgpack";

import {
  checkFunctionObjectProperty,
  convertType,
  processDocLines,
} from "../vim";
import {
  attachInlineJSDoc2Node,
  getInterface,
  headAstNodes,
  IFunction,
  IInterface,
  ILiteralType,
  IParameter,
  IProp,
  writeTSFile,
} from "../ts";
import {
  IApiFunction,
  ICliFunction,
  LuaObjectPropMap,
  Modules,
  NvimApiFunctions,
  NvimCliApiFunctions,
} from "./types";
import { mod2DefFilePath, mod2MpackPath } from "./constants";

/**
 * Convert IApiFunction to IFunction
 */
export const convertFunction = (
  fname: string,
  f: IApiFunction,
  mod: Record<string, Record<string, IApiFunction> | undefined>
): { node: IFunction; comments: string[] } | null => {
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
    f.parameters.forEach(([type, name], idx) => {
      const result = convertType(type);
      const temp: IParameter = {
        kind: "parameter",
        id: name.replace("...", ""),
        optional: result.optional,
        type: result.type,
        more: idx === f.parameters.length && name.startsWith("..."),
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
  const comments = processDocLines(docs);
  return { node, comments };
};

export const updateApiASTNodes = (
  node: IInterface,
  functions: ICliFunction[]
) => {
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
    if (f.kind === "function") {
      // f is function
      if (func.parameters.length > f.parameters.length) {
        // mismatch API length
        console.log(
          `${func.name} parameters length issue`,
          func.parameters,
          f.parameters
        );
      } else {
        for (let i = 0; i < func.parameters.length; i++) {
          if (func.parameters[i][1] !== f.parameters[i].id) {
            console.log(
              `${func.name} parameter name mismatches ${func.parameters[i][1]} ${f.parameters[i].id}`
            );
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

export const processMod = (mod: Modules) => {
  const file = fs.readFileSync(mod2MpackPath(mod));
  const result = decode(file) as NvimApiFunctions;
  const modName = mod.charAt(0).toUpperCase() + mod.slice(1);
  const interfaceNode = processApiFunctions(result, modName, [
    SyntaxKind.ExportKeyword,
  ]);

  if (mod === Modules.API) {
    console.log("== process API with cli mpack data ==");
    const cliApiContent = fs.readFileSync(mod2MpackPath("builtin-api"));
    const cliData = decode(cliApiContent) as NvimCliApiFunctions;
    updateApiASTNodes(interfaceNode, cliData.functions);
  }

  const targetFilePath = mod2DefFilePath(mod);
  const astData = headAstNodes.slice();
  const interfaceASTNode = getInterface(interfaceNode);
  attachInlineJSDoc2Node(interfaceASTNode, ["@noSelf"]);
  astData.push(interfaceASTNode);
  writeTSFile(targetFilePath, astData);
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

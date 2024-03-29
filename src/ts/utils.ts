import * as ts from 'typescript';
import { factory, TypeNode, Identifier } from "typescript";
import { isNumeric, writeFile } from "../utils";
import { typeNodes } from './constants';
import { ParamData } from "./ast";

/** complex config objects */
export const cfgTypes: Record<string, Identifier> = {
  float_config: factory.createIdentifier("INvimFloatWinConfig"),
};

const recordId = factory.createIdentifier("Record");
/** return Node for `Record<string, T>` */
export const getRecordTypeNode = (T: TypeNode) => {
  return factory.createTypeReferenceNode(recordId, [typeNodes.string(), T]);
};
/** return predefined interface type node */
export const getInterfaceNode = (config: string) => {
  if (config in cfgTypes) {
    return factory.createTypeReferenceNode(cfgTypes[config]);
  }
  console.log(`unknown config ${config}`);
  return typeNodes.unknown();
};
export const getDictNode = (param: ParamData) => {
  if (typeof param === 'string') {
    return getInterfaceNode(param);
  }
  console.log('pass AST node to dict', param);
  return typeNodes.unknown();
}

export const getArrayTypeNode = (type: TypeNode) => {
  return factory.createArrayTypeNode(type);
};

/**
 * Process ParamData type, return TypeNode.
 * If param is string type, return unknown type
 */
export const checkParamTypeGuard = (param: ParamData): TypeNode => {
  if (typeof param === "string") {
    console.log(`get param type error: ${param}`);
    return typeNodes.unknown();
  }
  return param as TypeNode;
};

export const checkParamType = (convert: (type: TypeNode) => TypeNode) => {
  return (param: ParamData) => {
    return convert(checkParamTypeGuard(param));
  };
};

export const getArrayTypeNodeWithValues = (...params: ParamData[]) => {
  params[0] = checkParamTypeGuard(params[0]);
  if (params.length === 2 && typeof params[1] === "string") {
    // array with specified length
    let paramCount = -1;
    paramCount = parseInt(params[1]);
    if (!isNumeric(params[1])) {
      console.log(`string param ${params[1]} is not a number`);
      paramCount = -1;
    }
    if (paramCount === -1) {
      // invalid number string
      return getArrayTypeNode(params[0]);
    }
    return factory.createTupleTypeNode(new Array(paramCount).fill(params[0]));
  }
  // normal tuple
  return factory.createTupleTypeNode(
    params.map((param) => checkParamTypeGuard(param))
  );
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

import { ParamData } from "./types";
import { factory, SyntaxKind, TypeNode, Identifier } from "typescript";

// https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
export const isNumeric = (n: string) => {
  const val = Number.parseFloat(n);
  return !Number.isNaN(val) && Number.isFinite(val);
};

export const typeNodes: Record<string, () => TypeNode> = {
  number: () => factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
  string: () => factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
  boolean: () => factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
  unknown: () => factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
  void: () => factory.createKeywordTypeNode(SyntaxKind.VoidKeyword),
  any: () => factory.createKeywordTypeNode(SyntaxKind.AnyKeyword),
};

/** complex config objects */
export const cfgTypes: Record<string, Identifier> = {
  float_config: factory.createIdentifier("INvimFloatWinConfig"),
};

typeNodes.unknownArray = () => factory.createArrayTypeNode(typeNodes.unknown());
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
/** Record<string, unknown> */
typeNodes.record = () => getRecordTypeNode(typeNodes.unknown());

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

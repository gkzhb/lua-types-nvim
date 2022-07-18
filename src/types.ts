import { ModifierSyntaxKind, TypeNode } from "typescript";
import { NVIM_TYPE_MAP } from "./constants";

// {{{1 types for mpack data
/** Neovim API function */
export interface IApiFunction {
  /** annotations for function */
  annotations: string[];
  /** function signature */
  signature: string;
  /** function parameters' type and name  */
  parameters: [type: keyof NVIM_TYPE_MAP, name: string][];
  /** documentation for function parameters */
  parameters_doc: Record<string, string>;
  /** documentation for this function */
  doc: string[];
  /** documentation for the return value of function */
  return: string[];
  /** references for this function */
  seealso: string[];
}

/** api.mpack data type */
export type NvimApiFunctions = Record<string, IApiFunction>;

export type LuaObjectPropMap = Record<string, NvimApiFunctions | undefined>;

// {{{1 types for generating ASTs
export interface INode {
  /** node type */
  kind: string;
}
/** function parameter */
export interface IParameter extends INode {
  kind: 'parameter';
  id: string;
  type: TypeNode;
  /** whether to add question mark */
  optional?: boolean;
}
/** function */
export interface IFunction extends INode {
  kind: 'function';
  /** function parameters */
  parameters: IParameter[];
  /** function return value type */
  return: TypeNode;
}
/** object property */
export interface IProp extends INode {
  kind: 'property';
  /** property name */
  id: string;
  /** property type */
  type: ILiteralType | IFunction;
  /** JSDoc comments */
  comments: string[];
  /** whether to add question mark */
  optional?: boolean;
}
/** `{ prop: Type, ... }` like type */
export interface ILiteralType extends INode {
  kind: 'literalType';
  props: Record<string, IProp>
};

export const createLiteralType = (props: Record<string, IProp>) => ({
  kind: 'literalType',
  props,
});

export interface IInterface extends INode {
  kind: 'interface';
  props: Record<string, IProp>
  id: string;
  modifiers: ModifierSyntaxKind[];
}

export interface IImport extends INode {
  kind: 'import';
  names: string[];
  modulePath: string;
}

export type ParamData = string | TypeNode;
// vim: set fdm=marker:

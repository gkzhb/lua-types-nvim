import { ModifierSyntaxKind, TypeNode } from "typescript";

// types for generating ASTs
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
  /** ``...args`, variable number of parameters */
  more: boolean;
}
/** function */
export interface IFunction extends INode {
  kind: 'function';
  /** function parameters */
  parameters: IParameter[];
  /** function return value type */
  return: TypeNode;
}

/** basic data type */
export interface IBaseType extends INode {
  kind: 'type';
  type: TypeNode;
}
/** object property */
export interface IProp extends INode {
  kind: 'property';
  /** property name */
  id: string;
  /** property type */
  type: ILiteralType | IFunction | IBaseType;
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

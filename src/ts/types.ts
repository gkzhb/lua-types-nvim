import { TypeNode } from "typescript";

export type TypeNodeFactory = () => TypeNode;

/** enum ts basic types */
export enum ETSType {
  Number = 'number',
  String = 'string',
  Boolean = 'boolean',
  Unknown = 'unknown',
  Void = 'void',
  Any = 'any',
  Function = 'function',
  Record = 'record',
  UnknownArray = 'unknownArray',
}

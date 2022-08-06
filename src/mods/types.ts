import { NVIM_TYPE_MAP } from "../vim";

// types for mpack data
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

export interface ICliFunction {
  since: number;
  name: string;
  return_type: string;
  method: boolean;
  /** [type, name] pairs */
  parameters: [string, string][];
}

export interface ICliUIEvent {
  name: string;
  since: number;
  /** [type, name] pairs */
  parameters: [string, string][];
}
/** builtin-api.mpack data type */
export interface NvimCliApiFunctions {
  version: {
    major: number;
    minor: number;
    patch: number;
    api_level: number;
    api_compatible: number;
    api_prerelease: boolean;
  };
  functions: ICliFunction[];
  ui_options: string[];
  types: Record<string, { id: number, prefix: string }>;
  error_types: Record<string, { id: number }>;
  ui_events: ICliUIEvent[];
}

export enum Modules {
  API = "api",
  LUA = "lua",
  LSP = "lsp",
  TREESITTER = "treesitter",
  DIAGNOSTIC = "diagnostic",
}

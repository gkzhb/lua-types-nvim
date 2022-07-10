import { NVIM_TYPE_MAP } from './constants';

/** Neovim API function */
export interface IApiFunction {
  /** annotations for function */
  annotations: string[];
  /** function signature */
  signature: string;
  /** function parameters and @TODO */
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

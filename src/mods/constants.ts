import { Modules } from './types';

export const moduleList = [
  Modules.API,
  Modules.LUA,
  Modules.LSP,
  Modules.TREESITTER,
  Modules.DIAGNOSTIC,
];

/** Get mpack file path for a module */
export const mod2MpackPath = (mod: string) => `./data/${mod}.mpack`;
/** Get ts definition file path for a module */
export const mod2DefFilePath = (mod: string) => `./types/${mod}.d.ts`;

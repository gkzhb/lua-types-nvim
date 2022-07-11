/// <reference path="utils.d.ts" />
/* vim: nomodeline: */

import { Api } from './api.d';
import { Lua } from './lua.d';
import { Lsp } from './lsp.d';
import { Treesitter } from './treesitter.d';
import { Diagnostic } from './diagnostic.d';

export declare interface IVim {
  api: Api;
  lua: Lua;
  lsp: Lsp;
  diagnostic: Diagnostic;
  treesitter: Treesitter;
  /** @TODO: fn */
}
declare global {
  const vim: IVim;
}

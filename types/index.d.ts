/// <reference path="utils.d.ts" />
// vim: nomodeline:
// about vim modeline: https://vim.fandom.com/wiki/Modeline_magic

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

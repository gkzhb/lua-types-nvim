/// <reference path="utils.d.ts" />

import { Api } from './api.d';

export declare interface IVim {
  api: Api;
}
declare global {
  const vim: IVim;
}

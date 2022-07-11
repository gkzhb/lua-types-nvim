# Lua Types for Neovim Lua APIs

[![npm version](https://badge.fury.io/js/@gkzhb%2Flua-types-nvim.svg)](https://badge.fury.io/js/@gkzhb%2Flua-types-nvim)
[![GitHub issues](https://img.shields.io/github/issues/gkzhb/lua-types-nvim)](https://github.com/gkzhb/lua-types-nvim/issues)
[![GitHub stars](https://img.shields.io/github/stars/gkzhb/lua-types-nvim)](https://github.com/gkzhb/lua-types-nvim/stargazers)
[![GitHub license](https://img.shields.io/github/license/gkzhb/lua-types-nvim)](https://github.com/gkzhb/lua-types-nvim/blob/main/LICENSE)

> **WIP**: Now this project provides types for `vim.api`, `vim.lsp`, `vim.lua`,
> `vim.treesitter` and `vim.diagnostic`.  
> Following I will try to generate types for `vim.fn` from `data/builtin-docs.json`.

[@gkzhb/lua-types-nvim](https://www.npmjs.com/package/@gkzhb/lua-types-nvim)
provides TypeScript definitions for Neovim Lua APIs of
[TypeScriptToLua](https://typescripttolua.github.io/) projects.

Inspired by [hrsh7th/deno-nvim-types: The Nvim API type definition for TypeScript](https://github.com/hrsh7th/deno-nvim-types)
and [folke/lua-dev.nvim](https://github.com/folke/lua-dev.nvim).
And thanks for [folke/lua-dev.nvim](https://github.com/folke/lua-dev.nvim)'s
`data` files.

## Usage

1. Add this npm package to your dev dependencies:

```bash
npm install -D @gkzhb/lua-types-nvim
```

1. Add this package in your `tsconfig.json` of TypeScriptToLua:

```json
{
  "compilerOptions": {
    ...
    "types": [
      ...
      "lua-types-nvim"
    ],
    ...
  }
}
```

## Development

TypeScript files in `src/` are node.js code that are executed to generate ts definition
files from Neovim mpack API metadata.

While `.d.ts` files in `types/` are type definitions for Neovim Lua APIs in TypeScriptToLua.

`yarn` scripts:

* Use `yarn` to install dependencies
* `yarn build` to compile TypeScript in `src`
* `yarn dev` to watch for ts file changes and compile to JS
* And `yanr build-dts` to run the compiled js file to generate Neovim API
type definitions.
* `yarn --silent preview [module]` to output JSON format content of mpack
  data, like

```bash
yarn --silent preview lua
```

  will output JSON format from `data/lua.mpack`.
* Use `yarn in-one-go` to install dependencies, compile TS and run JS to
generate types in one command.

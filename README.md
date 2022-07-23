# Lua Types for Neovim Lua APIs

[![GitHub workflow](https://github.com/gkzhb/lua-types-nvim/actions/workflows/npm-publish.yml/badge.svg?branch=main)](https://github.com/gkzhb/lua-types-nvim/actions/workflows/npm-publish.yml)
[![npm version](https://img.shields.io/npm/v/@gkzhb/lua-types-nvim)](https://www.npmjs.com/package/@gkzhb/lua-types-nvim)
[![GitHub stars](https://img.shields.io/github/stars/gkzhb/lua-types-nvim)](https://github.com/gkzhb/lua-types-nvim/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/gkzhb/lua-types-nvim)](https://github.com/gkzhb/lua-types-nvim/issues)
[![GitHub license](https://img.shields.io/github/license/gkzhb/lua-types-nvim)](https://github.com/gkzhb/lua-types-nvim/blob/main/LICENSE)

Now this project provides types for
* `vim.api`
* `vim.lsp`
* `vim.treesitter`
* `vim.diagnostic`
* `vim.fn`
* `vim.opt`, `vim.go`, `vim.bo`, etc

[@gkzhb/lua-types-nvim](https://www.npmjs.com/package/@gkzhb/lua-types-nvim)
provides TypeScript definitions for Neovim(v0.7.2) Lua APIs of
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

2. Add this package in your `tsconfig.json` of TypeScriptToLua:

```json
{
  "compilerOptions": {
    ...
    "types": [
      ...
      "@gkzhb/lua-types-nvim"
    ],
    ...
  }
}
```

## TODO

* [ ] Replace TypeScript types with Lua types.
* [ ] Manually add function parameter types for `vim.fn` which are not provided
in any strctured data.
* [ ] Generate `types/index.d.ts` by code

## Development

TypeScript files in `src/` are node.js code that are executed to generate ts definition
files from Neovim mpack API metadata.

While `.d.ts` files in `types/` are type definitions for Neovim Lua APIs in TypeScriptToLua.

`yarn` scripts:

* Use `yarn` to install dependencies
* `yarn build` to compile TypeScript in `src`
* `yarn dev` to watch for ts file changes and compile to JS
* `yarn parse-nearley` to build parser required to process `vim.fn` documentations
* And `yarn build-dts` to run the compiled js file to generate Neovim API
type definitions.
  * `yarn build-api-dts` to process mpack files
  * `yarn build-fn-dts` to generate definitions for `vim.fn` from
[`builtin-docs.json`](./data/builtin-docs.json) and [`builtin.txt`](./data/builtin.txt)
* `yarn --silent preview [module]` to output JSON format content of mpack
  data, like

```bash
yarn --silent preview lua
```

  will output JSON format from `data/lua.mpack`.
* Use `yarn in-one-go` to install dependencies, compile TS and run JS to
generate types in one command.

This project uses TypeScript `factory` to generate ASTs and print them to files.

Refer to [docs.md](./docs.md) for more about development.

### APIs

The structure data about APIs are in `data/` folder.

[`api.mpack`](./data/api.mpack), [`lsp.mpack`](./data/lsp.mpack),
[`lua.mpack`](./data/lua.mpack), [`diagnostic.mpack`](./data/diagnostic.mpack),
[`treesitter.mpack`](./data/treesitter.mpack) and
[`builtin-docs.json`](./data/builtin-docs.json) are from
[folke/lua-dev.nvim](https://github.com/folke/lua-dev.nvim).
Data in these mpack files are the same type `NvimApiFunctions`.

[`builtin-api.mpack`](./data/builtin-api.mpack) is from Neovim command line

```bash
nvim --api-info
```

The data type is `NvimCliApiFunctions`.

[`builtin.txt`](./data/builtin.txt) is from Neovim documentation file in
`$VIMRUNTIME` which contains `vim.fn` summary information in Section 1 Overview.

From this file and [`builtin-docs.json`](./data/builtin-docs.json) I get vim
function name, parameter names, return type and not only brief but also detailed
documentations.

### References

* [factory.createSourceFile doesn't accept JSDoc node (typings issue) · Issue #44151 · microsoft/TypeScript](https://github.com/microsoft/TypeScript/issues/44151)
* [Add capability of transforming and emitting JSDoc comments · Issue #17146 · microsoft/TypeScript](https://github.com/microsoft/TypeScript/issues/17146)
* Thank [TypeScript AST Viewer](https://ts-ast-viewer.com/#) so much for the
useful tool that helps to develop with Typescript AST.
* Also thank [Nearley Parser Playground](https://omrelli.ug/nearley-playground/)
for the great DX with [nearley.js - JS Parsing Toolkit](https://nearley.js.org/).

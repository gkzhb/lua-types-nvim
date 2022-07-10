# Lua Types for Neovim Lua APIs

> WIP

TypeScript definitions for Neovim Lua APIs for
[TypeScriptToLua](https://typescripttolua.github.io/) projects.

Inspired by [hrsh7th/deno-nvim-types: The Nvim API type definition for TypeScript.](https://github.com/hrsh7th/deno-nvim-types)
and [folke/lua-dev.nvim](https://github.com/folke/lua-dev.nvim)

## Development

TypeScript files in `src/` are node.js code that are executed to generate ts definition
files from Neovim mpack API metadata.

While `.d.ts` files in `types/` are type definitions for Neovim Lua APIs in TypeScriptToLua.

Use `yarn` to install dependencies, `yarn build` to compile TypeScript in `src`
and `yanr build-dts` to run the compiled js file to generate Neovim API type definitions.

# About source code

## How this project works

[Neovim](https://github.com/neovim/neovim) provides a Python script
[`gen_vimdoc.py`](https://github.com/neovim/neovim/blob/master/scripts/gen_vimdoc.py)
to generate vim doc and structural mpack files from the C source code or lua
source code, utilizing [Doxygen](https://doxygen.nl/) (a documentation generator).

The script will generate `api.mpack`, `diagnostic.mapck`, `lsp.mpack`,
`lua.mpack`, `treesitter.mpack` and corresponding vim doc which are located at
`<neovim project root>/runtime/doc/` if you run `python scripts/gen_vimdoc.py`
in the root of neovim project.

With `INCLUDE_C_DECL` environment variable defined, running the above script
will generate mpack files that contains C function declarations.

However, these mpack files do not contain all of the information about neovim
lua APIs:

1. some `vim` properties are manually maintained in the
`lua.txt` help file. Part of this vim help file is automatically generated which
is after `lua-vim` help tag (including this).
1. Builtin VimL functions are also not provided.
1. Lua modules which only exclue `vim.api` can't get any type information

We can only get these information from manually maintained vim doc files.

- For buitlin VimL functions, this project tries to extract data from
`builtin.txt` help file.
- For lua module types, we have to manually maintain type definitions in our
source code. That is what code in `src/data/` will accomplish.
- For omitted APIs, we can directly add them to TS type definitions files.

## Project structure

```text
src/
├── data/ -- TODO: manually created type information
├── index.ts -- aggregate all functions to generate type definitions
├── mods/ -- generate type definitions for vim.api, vim.fn, vim.lsp, vim.treesitter, vim.diagnostic and vim.fn
│   ├── api.ts -- vim.api, vim.fn, vim.lsp, treesitter, vim.diagnostic
│   ├── constants.ts
│   ├── fn.ts -- vim.fn
│   ├── index.ts
│   ├── option.ts -- vim options for windows, buffers, etc
│   ├── types.ts
│   └── utils.ts
├── preview.ts -- view mpack file content in JSON format
├── ts/ -- TypeScript related
│   ├── ast/ -- TypeScript AST related
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── constants.ts
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
├── utils.ts
└── vim/ -- vim related stuff
    ├── constants.ts
    ├── help-doc.ts
    ├── index.ts
    ├── types.ts
    └── utils.ts
```

## Prosedure of generating type definitions from mapck files

1. Read from mpack file to get `NvimApiFunctions` data;
1. Analyze function names to recursively search property objects and generate
corresponding data structure;
1. From the previous generated data structure, create TypeScript AST nodes;
1. Write these ASTs to `d.ts` files.

## Nearley parser

Use `yarn parse-nearley` command to parse `func_signature.ne` to
`dist/func_signature.js` which later will be used by `src/fn.ts`.

`yarn build-parser-diag` will generate `func_signature_railroad_diagrams.html`
file which shows visualized railroad diagrams for non-terminals.

In `func_signature.ne` most non-terminals eat up the beginning whitespaces
but not trailing whitespaces to avoid ambiguity in the grammar.

For example, `param` eats up beginning and trailing whitespaces,
and another non-terminal `remainReqParamList` also eats up beginning whitespaces.
And now we have a rule that concatenates these two:

```nearley
reqParamList -> param remainReqParamList
```

Whitespaces between them can belong to `param` or belong to `remainReqParamList`,
which leads to ambiguous grammar.


# About source code

## Project structure

```text
src/
├── api.ts -- generate api.d.ts, treesitter.d.ts etc from mpack file
├── constants.ts
├── data/ -- TODO: manually created type information
├── fn.ts -- generate fn.d.ts
├── help-doc.ts -- related to process vim help doc file
├── index.ts -- generate all d.ts files
├── mpack.ts -- mpack files related
├── option.ts -- generate option.d.ts
├── preview.ts -- view mpack file content in JSON format
├── ts -- TypeScript AST related
│   ├── index.ts
│   └── utils.ts -- functions that convert from custom interface to TypeScript AST nodes
├── ts-types.ts -- custom interface to represent TypeScript AST nodes
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


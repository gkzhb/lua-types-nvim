# About source code

## Prosedure of generating type definitions of Lua APIs

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


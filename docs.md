# About source code

## Prosedure of generating type definitions of Lua APIs

1. Read from mpack file to get `NvimApiFunctions` data;
1. Analyze function names to recursively search property objects and generate
corresponding data structure;
1. From the previous generated data structure, create TypeScript AST nodes;
1. Write these ASTs to `d.ts` files.

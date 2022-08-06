import { factory, Node, SyntaxKind } from "typescript";
import { ETSType, TypeNodeFactory } from "./types";
import { getRecordTypeNode } from "./utils";
import { attachInlineJSDoc2Node, getImportNode } from "./ast";

export const typeNodes: Record<ETSType, TypeNodeFactory> = {
  [ETSType.Number]: () => factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
  [ETSType.String]: () => factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
  [ETSType.Boolean]: () => factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
  [ETSType.Unknown]: () => factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
  [ETSType.Void]: () => factory.createKeywordTypeNode(SyntaxKind.VoidKeyword),
  [ETSType.Any]: () => factory.createKeywordTypeNode(SyntaxKind.AnyKeyword),
  [ETSType.Function]: () => factory.createTypeReferenceNode(factory.createIdentifier('Function')),

  [ETSType.UnknownArray]: () => factory.createArrayTypeNode(typeNodes.unknown()),
  /** Record<string, unknown> */
  [ETSType.Record]: () => getRecordTypeNode(typeNodes.unknown()),
};

export const headAstNodes: Node[] = [
  getImportNode({
    kind: "import",
    names: ["INvimFloatWinConfig"],
    modulePath: "./utils",
  }),
];
attachInlineJSDoc2Node(headAstNodes[0], [
  "This is automatically generated file. Do not modify this file manually.",
  "@noResolution",
  "@noSelfInFile",
]);

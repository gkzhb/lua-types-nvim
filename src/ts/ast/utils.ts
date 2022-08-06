import {
  factory as f,
  SyntaxKind,
  TypeElement,
  setSyntheticLeadingComments,
  Node,
} from "typescript";
import { typeNodes } from "../constants";
import { IFunction, IImport, IInterface, ILiteralType, IProp } from "./types";

export const questionToken = f.createToken(SyntaxKind.QuestionToken);
/** IImport to AST node */
export const getImportNode = (node: IImport) => {
  const ids = node.names.map((mod) =>
    f.createImportSpecifier(false, undefined, f.createIdentifier(mod))
  );
  return f.createImportDeclaration(
    undefined,
    undefined,
    f.createImportClause(true, undefined, f.createNamedImports(ids)),
    f.createStringLiteral(node.modulePath)
  );
};

export const getInlineJSDocString = (comments: string) => {
  return `* ${comments} `;
};

/** add multiple inline JSDoc to AST node */
export const attachInlineJSDoc2Node = (node: Node, comments: string[]) => {
  setSyntheticLeadingComments(
    node,
    comments.map((comment) => ({
      kind: SyntaxKind.MultiLineCommentTrivia,
      text: getInlineJSDocString(comment),
      hasTrailingNewLine: true,
      hasLeadingNewline: false,
      pos: -1,
      end: -1,
    }))
  );
};

export const getJSDocString = (comments: string[]) => {
  return `*
${comments.map((s) => " * " + s).join("\n")}
 `;
};

export const attachJSDoc2Node = (node: Node, comments: string[]) => {
  setSyntheticLeadingComments(node, [
    {
      kind: SyntaxKind.MultiLineCommentTrivia,
      text: getJSDocString(comments),
      hasTrailingNewLine: true,
      hasLeadingNewline: true,
      pos: -1,
      end: -1,
    },
  ]);
}
/** properties of Record<string, IProp> to AST nodes */
export const getProps = (props: Record<string, IProp>) => {
  const nodes: TypeElement[] = [];
  for (const propName in props) {
    const prop = props[propName];
    let propTypeNode = typeNodes.unknown();
    switch (prop.type.kind) {
      case "function":
        propTypeNode = getFunction(prop.type);
        break;
      case "literalType":
        propTypeNode = getTypeLiteral(prop.type);
        break;
      case "type":
        propTypeNode = prop.type.type;
        break;
      default:
    }
    const node = f.createPropertySignature(
      undefined,
      f.createIdentifier(prop.id),
      prop.optional ? questionToken : undefined,
      propTypeNode
    );
    if (prop.comments.length) {
      attachJSDoc2Node(node, prop.comments);
    }
    nodes.push(node);
  }
  return nodes;
}

/** IInterface to AST node */
export const getInterface = (node: IInterface) => {
  const props = getProps(node.props);
  return f.createInterfaceDeclaration(
    undefined,
    node.modifiers.map((modifier) => f.createModifier(modifier)),
    f.createIdentifier(node.id),
    undefined,
    undefined,
    props
  );
};

/** IFunction to AST node */
export const getFunction = (func: IFunction) => {
  return f.createFunctionTypeNode(
    undefined,
    func.parameters.map((param) =>
      f.createParameterDeclaration(
        undefined,
        undefined,
        param.more ? f.createToken(SyntaxKind.DotDotDotToken) : undefined,
        f.createIdentifier(param.id),
        param.optional && !param.more ? questionToken : undefined,
        param.type
      )
    ),
    func.return
  );
};

/** ILiteralType to AST node */
export const getTypeLiteral = (type: ILiteralType) => {
  return f.createTypeLiteralNode(getProps(type.props));
};

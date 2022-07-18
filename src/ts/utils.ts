import {
  factory as f,
  SyntaxKind,
  KeywordTypeSyntaxKind,
  PropertySignature,
  Modifier,
  ModifierSyntaxKind,
  TypeNode,
  TypeElement,
  setSyntheticLeadingComments,
  Node,
} from "typescript";
import { IFunction, IImport, IInterface, ILiteralType, IProp } from "../types";

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
  const questionToken = f.createToken(SyntaxKind.QuestionToken);
  for (const propName in props) {
    const prop = props[propName];
    const propTypeNode =
      prop.type.kind === "function"
        ? getFunction(prop.type)
        : getTypeLiteral(prop.type);
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
        undefined,
        f.createIdentifier(param.id),
        undefined,
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


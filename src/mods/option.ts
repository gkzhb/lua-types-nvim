import { SyntaxKind } from "typescript";
import { builtinData, convertType, processDocLines } from "../vim";
import {
  IBaseType,
  IInterface,
  IProp,
  writeTSFile,
  headAstNodes,
  attachInlineJSDoc2Node,
  getInterface,
} from "../ts";
import { mod2DefFilePath } from "./constants";

/** Vim option scopes */
export enum EVimOptionType {
  /** full options */
  Option = "opt",
  /** global: global options */
  Global = "global",
  /** buffer: buffer options */
  Buffer = "buffer",
  Window = "window",
}

export const generateOptionTypes = () => {
  console.log("=== start to build options types ===");
  const scopedOptions: Record<EVimOptionType, IInterface> = {
    [EVimOptionType.Option]: {
      kind: "interface",
      props: {},
      id: "Option",
      modifiers: [SyntaxKind.ExportKeyword],
    },
    [EVimOptionType.Global]: {
      kind: "interface",
      props: {},
      id: "Global",
      modifiers: [SyntaxKind.ExportKeyword],
    },
    [EVimOptionType.Buffer]: {
      kind: "interface",
      props: {},
      id: "Buffer",
      modifiers: [SyntaxKind.ExportKeyword],
    },
    [EVimOptionType.Window]: {
      kind: "interface",
      props: {},
      id: "Window",
      modifiers: [SyntaxKind.ExportKeyword],
    },
  };
  const reg = /^(?<type>\w+)\s*(\(.*\))?$/;
  const globalOptionTypeReg = /^\s*global\s.*$/;
  const localOptionTypeReg = /local to (?<scope>[a-zA-z]+).*/;
  const options = builtinData.documents.options;
  const scopeStrings: Set<string> = new Set();
  for (const option in options) {
    const result = reg.exec(options[option][0])?.groups;
    if (result) {
      const prop: IProp = {
        kind: "property",
        id: option,
        type: {
          kind: "type",
          type: convertType(result.type).type,
        } as IBaseType,
        comments: processDocLines(options[option]),
      };
      scopedOptions.opt.props[option] = prop;
      const scopeString = options[option][1];
      if (globalOptionTypeReg.test(scopeString)) {
        scopedOptions[EVimOptionType.Global].props[option] = prop;
      }
      if (localOptionTypeReg.test(scopeString)) {
        const result = localOptionTypeReg.exec(scopeString)?.groups;
        if (result && result.scope in scopedOptions) {
          scopedOptions[result.scope as EVimOptionType].props[option] = prop;
        } else if (!scopeStrings.has(scopeString)) {
          console.log(
            "unknown scope:",
            result?.scope,
            ", original string:",
            scopeString
          );
        }
      }
      if (!scopeStrings.has(scopeString)) {
        scopeStrings.add(scopeString);
      }
    }
  }
  // console.log('scope strings:\n', [...scopeStrings].join('\n'));
  const astData = headAstNodes.slice();
  for (const optType in scopedOptions) {
    const interfaceASTNode = getInterface(
      scopedOptions[optType as EVimOptionType]
    );
    attachInlineJSDoc2Node(interfaceASTNode, ["@noSelf"]);
    astData.push(interfaceASTNode);
  }
  writeTSFile(mod2DefFilePath("option"), astData);
};

if (require.main === module) {
  generateOptionTypes();
}

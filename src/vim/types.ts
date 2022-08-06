// types for builtin-docs.json
export interface IBaseCompletionItem {
  /** item name */
  label: string;
  kind: number;
  sortText: string;
  insertText: string;
  insertTextFormat: number;
}
export interface IOptionItem extends IBaseCompletionItem {
  /** option variable type */
  detail: string;
  /** empty string */
  documentation: string;
}

export interface IBuiltinDocs {
  completionItems: {
    options: IOptionItem,
    variables: IBaseCompletionItem,
  };
  documents: {
    functions: Record<string, string[]>,
    options: Record<string, string[]>,
    variables: Record<string, string[]>,
  };
  signatureHelp: Record<string, [string, string]>;
}


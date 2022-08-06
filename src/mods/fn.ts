// process `builtin.txt` help doc to generate types for `vim.fn`
// @ts-expect-error
import * as nearley from 'nearley';
import * as fs from 'fs';
import { SyntaxKind } from "typescript";
import { IFunction, IInterface, IParameter, IProp } from '../types';
import { typeNodes } from '../ts';
import { builtinData, headAstNodes, mod2DefFilePath, NVIM_TYPE_MAP } from "../constants";
import { isNumeric, convertType, processDocLines } from "../utils";
// @ts-expect-error
import * as funcParser from '../func_signature.js';
import { writeTSFile } from '../mpack';
import { attachInlineJSDoc2Node, getInterface } from '../ts';
import { divideSections, findSectionByHelpTag } from '../vim/help-doc';

interface IParserParam {
  type: 'param';
  id: {
    text: string;
  };
  more?: boolean;
  optional: boolean;
}
interface IParserFunction {
  type: 'function';
  params: IParserParam[];
}
/** read lines from doc text file and combine wrapped lines */
const readFnDocs = () => {
  const sections = divideSections('./data/builtin.txt');
  // process overview
  const tableLineReg = /^USAGE\t+RESULT\t+DESCRIPTION/;
  let tableLineIdx = -1;
  const sectionIdx = findSectionByHelpTag(sections, 'builtin-function-list');
  if (sectionIdx === -1) {
    throw new Error('Cannot find builtin-function-list in help file');
  }
  for (let i = 0; i < sections[sectionIdx].length; i++) {
    if (tableLineReg.test(sections[sectionIdx][i])) {
      tableLineIdx = i;
      break;
    }
  }
  const content = sections[sectionIdx];
  const tableLineList: string[] = [];
  let tableLines = 0;
  const newRowReg = /^\w/;
  const descNewLineReg = /^(\t){5}[^\s]/;
  const resultNewLineReg = /^(\t){4}[^\s]/;
  // merge multiple lines of one table row into one line
  for (let i = tableLineIdx + 1; i < content.length; i++) {
    const line = content[i];
    if (!line.trim().length) {
      // skip empty lines
      continue;
    }
    if (descNewLineReg.test(line)) {
      // description in new line, combine to the last line
      // this may be multiple description lines, or after return column
      tableLineList[tableLines - 1] = `${tableLineList[tableLines - 1]} ${content[i].trimStart()}`;
    } else {
      if (resultNewLineReg.test(line)) {
        // result in new line, combine to the last line
        tableLineList[tableLines - 1] =
          tableLineList[tableLines - 1] + "\t" + content[i].trimStart();
      } else if (newRowReg.test(line)) {
        tableLineList.push(line);
        tableLines++;
      } else {
        console.warn('invalid line', line);
      }
    }
  }
  return tableLineList;
};

const resultTypeReg = /^[A-Z][a-z]+|any/;
const twoReturnTypeReg = /^(\w+)( or |\/)(\w+)\s/;
const oneReturnTypeReg = /^(\w+)\s/;
const divideRow = (row: string): [string, string[], string] | null => {
  if (!row.trim().length) {
    return null;
  }
  let divider1 = row.indexOf(')') + 1;
  if (divider1 === 0) {
    // one function doesn't have ')', so we have to use '\t' to find column divider position
    // If we only use \t to find the first column divider, we may encounter the situation like `settabwinvar`
    // where there is no return type and spaces as divider before `DESCRIPTION` column
    divider1 = row.indexOf('\t');
  }
  const col1 = row.slice(0, divider1);
  let remain = row.slice(divider1).trim();
  // multiple return types are or logic
  let returnType: string[] = ['any'];
  if (resultTypeReg.test(remain)) {
    // return type column exists
    let length = -1;
    if (twoReturnTypeReg.test(remain)) {
      const result = twoReturnTypeReg.exec(remain)!;
      returnType = [result[1], result[3]];
      length = result[0].length;
    } else {
      const result = oneReturnTypeReg.exec(remain)!;
      if (!(result[1].toLowerCase() in NVIM_TYPE_MAP)) {
        // line wrap with 4 tabs starting with is description, not return type
        console.log(`${col1} wrapped line starts with description: ${remain}`);
        return [col1, returnType, remain];
      }
      returnType = [result[1]];
      length = result[0].length;
    }
    remain = remain
      .slice(length)
      .trim();
  }

  return [col1, returnType, remain];
}

const processParamText = (text: string, idx: number, paramSet: Set<string>) => {
  let retVal = text;
  if (isNumeric(retVal)) {
    retVal = 'numericValue';
  } else if (text === 'default') {
    retVal = 'defaultValue';
  }
  retVal = retVal.replace(/-/g, '_');
  if (paramSet.has(retVal)) {
    retVal += (idx + 1).toString();
  }
  paramSet.add(retVal);
  return retVal;
};

export const generateFnTypes = () => {
  const tableLineList = readFnDocs();
  const fnMap: Record<string, IProp> = {};
  const table = tableLineList.map(line => divideRow(line)).filter((row): row is [string, string[], string] => Boolean(row));
  const nameReg = /^(?<funcName>[\w_\.]+)\(((, | )?\{(?<requiredArgs>[\d\w-]+)\})*(?<remainStr>[\[\]\{\}\d\w-_, \.]+)?\)$/;
  table.forEach(row => {
    if (!row[0].endsWith(')')) {
      // fix typo that forgets ')'
      row[0] += ')';
    }
    const result = nameReg.exec(row[0])?.groups;
    const fnName = result?.funcName;
    if (!fnName) {
      console.log(`cannot extract function name "${row[0]}"`);
      return;
    }
    if (!(fnName in builtinData.signatureHelp)) {
      console.log(`no fn signature for "${row[0]}"`);
      return;
    }
    // cannot reuse parser
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(funcParser));
    try {
      parser.feed(row[0]);
    } catch(e) {
      console.error('parse error', e, 'for line', row[0]);
      process.exit(1);
    }
    if (parser.results?.length) {
      const paramSet: Set<string> = new Set();
      const parserParams = (parser.results[0] as IParserFunction).params;
      const params = parserParams.map((param, idx): IParameter => {
        const more = idx === parserParams.length - 1 && Boolean(param.more);
        return {
          kind: "parameter",
          id: processParamText(param.id.text, idx, paramSet),
          type: more ? typeNodes.unknownArray() : typeNodes.unknown(),
          optional: param.optional,
          more,
        };
      });
      const returnTypes = row[1].map(type => convertType(type).type);
      let returnType = returnTypes.length > 1 ? returnTypes[0] : returnTypes[0];
      const signatureReturn = builtinData.signatureHelp[fnName][1];
      if (signatureReturn !== row[1][0]) {
        if (signatureReturn === 'none') {
          returnType = typeNodes.void();
        } else {
          console.log(`"${fnName}" ret type mismatch: "${signatureReturn}" "${row[1]}"`);
        }
      }
      const funcType: IFunction = {
        kind: 'function',
        return: returnType,
        parameters: params,
      };
      fnMap[fnName] = {
        kind: 'property',
        id: fnName,
        comments: [row[2]],
        type: funcType,
      };
      if (fnName in builtinData.documents.functions) {
        fnMap[fnName].comments.push(...processDocLines(builtinData.documents.functions[fnName]));
      } else {
        console.log(`cannot find docs for "${fnName}"`);
      }
      // console.log(JSON.stringify(fnMap[fnName]));
    } else {
      console.error(`empty parser result for "${row[0]}"`);
    }
  });
  const fnInterface: IInterface = {
    kind: 'interface',
    props: fnMap,
    id: 'Fn',
    modifiers: [SyntaxKind.ExportKeyword],
  };
  const astData = headAstNodes.slice();
  const interfaceNode = getInterface(fnInterface);
  attachInlineJSDoc2Node(interfaceNode, ['@noSelf']);
  astData.push(interfaceNode);
  writeTSFile(mod2DefFilePath('fn'), astData);
};

if (require.main === module) {
  generateFnTypes();
}

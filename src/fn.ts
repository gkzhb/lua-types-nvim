// process `builtin.txt` help doc
// @ts-expect-error
import * as nearley from 'nearley';
import * as fs from 'fs';
import {SyntaxKind} from 'typescript';
import { IBuiltinDocs, IFunction, IInterface, IParameter, IProp } from './types';
import { isNumeric, typeNodes } from './ts-types';
import { headAstNodes, mod2DefFilePath, NVIM_TYPE_MAP } from "./constants";
import { convertType, processDocLines } from "./utils.js";
// @ts-expect-error
import * as funcParser from './func_signature.js';
import {writeTSFile} from './mpack';
import {getInterface} from './ts';

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
  const file = fs.readFileSync('./data/builtin.txt', { encoding: 'utf-8' });
  const sections: string[][] = [];
  const lines = file.split('\n');
  const sectionDivReg = /^=+$/;
  let prevSection = 0;
  for (let i = 0; i < lines.length; i++) {
    if (sectionDivReg.test(lines[i])) {
      sections.push(lines.slice(prevSection, i - 1));
      prevSection = i + 1;
    }
  }
  sections.push(lines.slice(prevSection, lines.length - 1));

  // process overview
  const tableLineReg = /^USAGE\t+RESULT\t+DESCRIPTION/;
  let tableLineIdx = -1;
  for (let i = 0; i < sections[1].length; i++) {
    if (tableLineReg.test(sections[1][i])) {
      tableLineIdx = i;
      break;
    }
  }
  const tableLineList: string[] = [];
  let tableLines = 0;
  const newRowReg = /^\w/;
  const descNewLineReg = /^(\t){5}[^\s]/;
  const resultNewLineReg = /^(\t){4}[^\s]/;
  // merge multiple lines of one table row into one line
  for (let i = tableLineIdx + 1; i < sections[1].length; i++) {
    const line = sections[1][i];
    if (!line.trim().length) {
      // skip empty lines
      continue;
    }
    if (descNewLineReg.test(line)) {
      // description in new line, combine to the last line
      // this may be multiple description lines, or after return column
      tableLineList[tableLines - 1] = `${tableLineList[tableLines - 1]} ${sections[1][i].trimStart()}`;
    } else {
      if (resultNewLineReg.test(line)) {
        // result in new line, combine to the last line
        tableLineList[tableLines - 1] =
          tableLineList[tableLines - 1] + "\t" + sections[1][i].trimStart();
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
const tableLineList = readFnDocs();

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
      if (!(result[1] in NVIM_TYPE_MAP)) {
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
  let retVal = text.replace(/-/g, '_');
  if (isNumeric(retVal)) {
    retVal = 'numericValue';
  } else if (text === 'default') {
    retVal = 'defaultValue';
  }
  if (paramSet.has(retVal)) {
    retVal += (idx + 1).toString();
  }
  paramSet.add(retVal);
  return retVal;
};

const fnMap: Record<string, IProp> = {};
const table = tableLineList.map(line => divideRow(line)).filter((row): row is [string, string[], string] => Boolean(row));
const builtinData = JSON.parse(
  fs.readFileSync("./data/builtin-docs.json", { encoding: "utf-8" })
) as IBuiltinDocs;
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
    console.error('parse error', e);
  }
  if (parser.results?.length) {
    const paramSet: Set<string> = new Set();
    const params = (parser.results[0] as IParserFunction).params.map(
      (param, idx): IParameter => ({
        kind: "parameter",
        id: processParamText(param.id.text, idx, paramSet),
        type: typeNodes.unknown(),
        optional: param.optional,
      })
    );
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
astData.push(getInterface(fnInterface));
writeTSFile(mod2DefFilePath('fn'), astData);

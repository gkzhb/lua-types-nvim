import { decode } from '@msgpack/msgpack';
import { modules } from "./constants";
import * as fs from 'fs';

import { NvimApiFunctions } from './types';
import { apiModTemplate, convertFunction2TypeDef, mod2DefFilePath, mod2MpackPath } from './utils';


const file = fs.readFileSync(mod2MpackPath(modules.api));
const result = decode(file) as NvimApiFunctions;

const functions = [];
for (const fname in result) {
  functions.push(convertFunction2TypeDef(fname, result[fname]));
}
const content = apiModTemplate(functions);

try {
  fs.writeFileSync(mod2DefFilePath(modules.api), content);
} catch (err) {
  console.error('write error', err);
}

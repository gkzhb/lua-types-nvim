import { mod2MpackPath } from "./constants";
import * as fs from 'fs';
import { decode } from '@msgpack/msgpack';

const mod = process.argv.length > 2 ? process.argv[2] : null;

if (!mod) {
  console.log("Please provide module name.");
  process.exit(0);
}

const mpackPath = mod2MpackPath(mod);
if (!fs.existsSync(mpackPath)) {
  console.log(`Module ${mod} does not exist.`);
  process.exit(0);
}

const file = fs.readFileSync(mpackPath);
const result = decode(file) as any;
console.log(JSON.stringify(result, undefined, 2));

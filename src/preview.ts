import { mod2MpackPath } from "./constants";
import * as fs from 'fs';
import { decode } from '@msgpack/msgpack';

/** Preview mpack file content in JSON format
 * @param mod module name
 * @return JSON string
 */
export const previewMpackContent = (mod: string) => {
  const mpackPath = mod2MpackPath(mod);
  if (!fs.existsSync(mpackPath)) {
    console.log(`Module ${mod} does not exist.`);
    process.exit(0);
  }

  const file = fs.readFileSync(mpackPath);
  const result = decode(file) as any;
  return JSON.stringify(result, undefined, 2);
};

if (require.main === module) {
  const mod = process.argv.length > 2 ? process.argv[2] : null;

  if (!mod) {
    console.log("Please provide module name.");
    process.exit(0);
  }

  console.log(previewMpackContent(mod));
}

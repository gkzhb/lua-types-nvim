import { moduleList } from "./constants";
import { processMod } from "./mpack";

for (const mod of moduleList) {
  console.log(`=== start process module ${mod} ===`);
  processMod(mod);
}

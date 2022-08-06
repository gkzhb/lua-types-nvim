import { moduleList } from "../constants";
import { processMod } from "../mpack";

export const generateApiTypes = () => {
  for (const mod of moduleList) {
    console.log(`=== start process module ${mod} ===`);
    processMod(mod);
  }
};

if (require.main === module) {
  generateApiTypes();
}

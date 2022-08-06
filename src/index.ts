import { generateFnTypes, generateApiTypes, generateOptionTypes } from "./mods";

export * from './preview';
export { generateFnTypes, generateApiTypes, generateOptionTypes };

if (require.main === module) {
  generateApiTypes();
  generateFnTypes();
  generateOptionTypes();
}

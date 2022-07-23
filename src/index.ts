import { generateFnTypes } from './fn';
import { generateApiTypes } from './api';
import { generateOptionTypes } from './option';

export {
  generateFnTypes, generateApiTypes, generateOptionTypes
};

if (require.main === module) {
  generateApiTypes();
  generateFnTypes();
  generateOptionTypes();
}

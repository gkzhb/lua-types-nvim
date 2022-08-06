import * as fs from "fs";
// https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
export const isNumeric = (n: string) => {
  const val = Number.parseFloat(n);
  return !Number.isNaN(val) && Number.isFinite(val);
};

export const writeFile = (fileName: string, content: string) => {
  try {
    fs.writeFileSync(fileName, content);
  } catch (err) {
    console.error("write error", err);
  }
};

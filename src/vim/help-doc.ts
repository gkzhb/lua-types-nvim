// functions related to process vim help text file
import * as fs from 'fs';

/** read vim help text file from `path` and divide lines into sections */
export const divideSections = (helpFilePath: string): string[][] => {
  const file = fs.readFileSync(helpFilePath, { encoding: 'utf-8' });
  const sections: string[][] = [];
  const lines = file.split('\n');
  // delete last vim mode line
  lines.pop();
  const sectionDivReg = /^=+$/;
  let prevSection = 0;
  for (let i = 0; i < lines.length; i++) {
    if (sectionDivReg.test(lines[i])) {
      sections.push(lines.slice(prevSection, i - 1));
      prevSection = i + 1;
    }
  }
  sections.push(lines.slice(prevSection, lines.length - 1));
  return sections;
}

/**
 * @returns section index
 */
export const findSectionByHelpTag = (sections: string[][], helpTag: string): number => {
  const tagStr = `*${helpTag}*`;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i][0].includes(tagStr)) {
      return i;
    }
  }
  return -1;
};

import fs from 'fs';
import path from 'path';

export function parseWoordlijstenMd() {
  const filePath = path.join(process.cwd(), 'woordlijsten.md');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const lijsten: { name: string, words: string[] }[] = [];
  let currentList: { name: string, words: string[] } | null = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('/')) {
      if (currentList) lijsten.push(currentList);
      currentList = { name: line.replace('/', '').trim(), words: [] };
    } else if (line && currentList) {
      currentList.words.push(line);
    }
  }
  if (currentList) lijsten.push(currentList);
  return lijsten;
} 
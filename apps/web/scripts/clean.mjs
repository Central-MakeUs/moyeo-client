import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(scriptDirectory, '..');

const generatedDirectories = ['.next', '.turbo', 'build', 'coverage', 'out', 'storybook-static'];

const entries = await readdir(appDirectory, { withFileTypes: true });
const generatedFiles = entries
  .filter(
    (entry) =>
      entry.isFile() &&
      (entry.name.endsWith('.tsbuildinfo') || entry.name.endsWith('storybook.log'))
  )
  .map((entry) => entry.name);

const targets = [...generatedDirectories, ...generatedFiles];

for (const target of targets) {
  const targetPath = path.resolve(appDirectory, target);

  if (path.dirname(targetPath) !== appDirectory) {
    throw new Error(`앱 디렉터리 밖의 경로는 삭제할 수 없습니다: ${targetPath}`);
  }

  await rm(targetPath, { recursive: true, force: true });
}

console.log(`웹 앱 생성물을 정리했습니다: ${targets.join(', ')}`);

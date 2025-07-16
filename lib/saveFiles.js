// lib/saveFiles.js
import path from 'path';
import fs from 'fs/promises';

export async function saveFiles(file) {
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${file.originalFilename}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, await fs.readFile(file.filepath));

  return `/uploads/${fileName}`;
}

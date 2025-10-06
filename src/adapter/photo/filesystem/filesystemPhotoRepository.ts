import { promises as fs } from "fs";
import path from "path";

export class FilesystemPhotoRepository {
  private baseDir: string;
  private publicBasePath: string;

  constructor({ baseDir, publicBasePath }: { baseDir: string; publicBasePath: string }) {
    this.baseDir = baseDir;
    this.publicBasePath = publicBasePath;
    fs.mkdir(this.baseDir, { recursive: true });
  }

  async savePhoto(file: { buffer: Buffer; originalname: string }, id: string): Promise<URL> {
    const safeName = file.originalname.replace(/\s+/g, "_");
    const filename = `${id}-${Date.now()}-${safeName}`;
    const filepath = path.join(this.baseDir, filename);

    await fs.writeFile(filepath, file.buffer);

    const base = process.env.PUBLIC_URL ?? "http://localhost:3000";
    return new URL(`${this.publicBasePath}/${filename}`, base);
  }
}

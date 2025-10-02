import { defineConfig } from "@mikro-orm/sqlite";
import { config as dotenvConfig } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Cargar variables del .env
dotenvConfig();

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  ComputerEntity,
  MedicalDeviceEntity,
  FrequentComputerEntity,
} from "@adapter/repository/sqlite/entities";

export default defineConfig({
  dbName: path.join(__dirname, process.env.DB_FILE_NAME || "db.sqlite"), // 👈 ruta absoluta
  entities: [ComputerEntity, MedicalDeviceEntity, FrequentComputerEntity],
  debug: true,
  migrations: {
    path: path.join(__dirname, "./src/migrations"),
    pathTs: path.join(__dirname, "./src/migrations"),
  },
});

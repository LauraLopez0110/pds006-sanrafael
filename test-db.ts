import "reflect-metadata";
import { MikroORM } from "@mikro-orm/sqlite";
import config from "./mikro-orm.config";
import { MikroOrmDeviceRepository } from "@adapter/repository/sqlite/mikro-orm-device.repository.ts";
import crypto from "crypto";

async function main() {
  const orm = await MikroORM.init(config);
  const repo = new MikroOrmDeviceRepository(orm.em.fork());

  // --- 1. Insertar un Computer ---
  const computer = {
    id: crypto.randomUUID(),
    brand: "Dell",
    model: "Latitude",
    color: "Black",
    photoURL: new URL("http://example.com/dell.png"),
    owner: { id: "user-1", name: "Alice" },
    updatedAt: new Date(),
    checkinAt: new Date(),
  };

  console.log("📥 Registrando Computer...");
  await repo.checkinComputer(computer);

  // --- 2. Insertar un MedicalDevice ---
  const medical = {
    id: crypto.randomUUID(),
    brand: "Siemens",
    model: "XRay-2000",
    photoURL: new URL("http://example.com/xray.png"),
    owner: { id: "med-1", name: "Bob" },
    serial: "MD-12345",
    updatedAt: new Date(),
    checkinAt: new Date(),
  };

  console.log("📥 Registrando MedicalDevice...");
  await repo.checkinMedicalDevice(medical);

  // --- 3. Registrar un FrequentComputer ---
  const frequentComputer = {
    device: computer,
    checkinURL: new URL("http://localhost:3000/devices/checkin"),
    checkoutURL: new URL("http://localhost:3000/devices/checkout"),
  };

  console.log("📥 Registrando FrequentComputer...");
  await repo.registerFrequentComputer(frequentComputer);

  // --- 4. Consultar todas las entidades ---
  console.log("\n🔍 Obteniendo Computers:");
  console.log(await repo.getComputers({ limit: 10, offset: 0 }));

  console.log("\n🔍 Obteniendo MedicalDevices:");
  console.log(await repo.getMedicalDevices({ limit: 10, offset: 0 }));

  console.log("\n🔍 Obteniendo FrequentComputers:");
  console.log(await repo.getFrequentComputers({ limit: 10, offset: 0 }));

  console.log("\n🔍 Obteniendo EnteredDevices:");
  console.log(await repo.getEnteredDevices({ limit: 10, offset: 0 }));

  await orm.close();
}

main().catch((err) => {
  console.error("❌ Error en test-db:", err);
});

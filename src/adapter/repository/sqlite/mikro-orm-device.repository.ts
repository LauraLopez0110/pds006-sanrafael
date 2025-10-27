import { EntityManager } from "@mikro-orm/sqlite";
import { DeviceRepository } from "@core/repository/device.repository";

import {
  Computer,
  FrequentComputer,
  MedicalDevice,
  DeviceCriteria,
  DeviceId,
  EnteredDevice,
} from "@core/domain";

import { ComputerEntity } from "./entities/computer.entity";
import { MedicalDeviceEntity } from "./entities/medical-device.entity";
import { FrequentComputerEntity } from "./entities/frequent-computer.entity";

// ⚡ Helper: mapea campos del dominio a propiedades de entidad
const FIELD_MAP: Record<string, string> = {
  "brand": "brand",
  "updatedAt": "updatedAt",
  "owner.id": "ownerId",
  "owner.name": "ownerName",
  "model": "model",
  "color": "color",
};

function mapField(field: string): string {
  const mapped = FIELD_MAP[field];
  if (!mapped) throw new Error(`Unsupported filter/sort field: ${field}`);
  return mapped;
}

// ⚡ Helper: transforma DeviceCriteria en filtros MikroORM
function buildFindOptions(criteria: DeviceCriteria): {
  where: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: Record<string, "asc" | "desc">;
} {
  const where: Record<string, unknown> = {};
  const opts: any = { where };

  if (criteria?.filterBy) {
    where[mapField(criteria.filterBy.field)] = criteria.filterBy.value;
  }

  if (criteria?.limit != null) opts.limit = criteria.limit;
  if (criteria?.offset != null) opts.offset = criteria.offset;

  if (criteria?.sortBy) {
    opts.orderBy = {
      [mapField(criteria.sortBy.field)]: criteria.sortBy.isAscending ? "asc" : "desc",
    };
  } else {
    opts.orderBy = { updatedAt: "desc" };
  }

  return opts;
}

// =============================================================
//  Implementación del repositorio con MikroORM
// =============================================================
export class MikroOrmDeviceRepository implements DeviceRepository {
  constructor(private readonly em: EntityManager) {}

  // --- REGISTROS ---

  // Registra un computador en BD
  async checkinComputer(computer: Computer): Promise<Computer> {
    const e = this.em.create(ComputerEntity, {
      id: computer.id,
      brand: computer.brand,
      model: computer.model,
      color: computer.color,
      photoURL: computer.photoURL.toString(),
      ownerId: computer.owner.id,
      ownerName: computer.owner.name,
      checkinAt: computer.checkinAt ?? new Date(),
      checkoutAt: computer.checkoutAt ?? null,
      updatedAt: computer.updatedAt ?? new Date(),
    });

    await this.em.persistAndFlush(e);
    return computer;
  }

  // Registra un dispositivo médico en la BD
  async checkinMedicalDevice(device: MedicalDevice): Promise<MedicalDevice> {
    const e = this.em.create(MedicalDeviceEntity, {
      id: device.id,
      brand: device.brand,
      model: device.model,
      photoURL: device.photoURL.toString(),
      ownerId: device.owner.id,
      ownerName: device.owner.name,
      checkinAt: device.checkinAt ?? new Date(),
      checkoutAt: device.checkoutAt ?? null,
      serial: device.serial,
      updatedAt: device.updatedAt ?? new Date(),
    });

    await this.em.persistAndFlush(e);
    return device;
  }

  // Registra un computador frecuente
  async registerFrequentComputer(computer: FrequentComputer): Promise<FrequentComputer> {
    const e = this.em.create(FrequentComputerEntity, {
      id: computer.device.id,
      brand: computer.device.brand,
      model: computer.device.model,
      ownerId: computer.device.owner.id,
      ownerName: computer.device.owner.name,
      photoURL: computer.device.photoURL.toString(),
      createdAt: new Date(),
      lastCheckinAt: computer.device.checkinAt ?? null,
      lastCheckoutAt: computer.device.checkoutAt ?? null,
      updatedAt: computer.device.updatedAt ?? new Date(),
    });

    await this.em.persistAndFlush(e);

    return {
      device: computer.device,
      checkinURL: new URL(`/devices/${computer.device.id}/checkin`, "http://localhost:3000"),
      checkoutURL: new URL(`/devices/${computer.device.id}/checkout`, "http://localhost:3000"),
    };
  }

  // Registra una nueva entrada para un computador frecuente
  async checkinFrequentComputer(id: DeviceId, datetime: Date): Promise<FrequentComputer> {
    const e = await this.em.findOne(FrequentComputerEntity, { id });
    if (!e) throw new Error("Frequent computer not found");

    e.lastCheckinAt = datetime;
    e.updatedAt = new Date();
    await this.em.persistAndFlush(e);

    return {
      device: {
        id: e.id,
        brand: e.brand,
        model: e.model,
        photoURL: new URL(e.photoURL),
        owner: { id: e.ownerId, name: e.ownerName },
        checkinAt: e.lastCheckinAt ?? undefined,
        checkoutAt: e.lastCheckoutAt ?? undefined,
        updatedAt: e.updatedAt,
      },
      checkinURL: new URL(`/devices/${e.id}/checkin`, "http://localhost:3000"),
      checkoutURL: new URL(`/devices/${e.id}/checkout`, "http://localhost:3000"),
    };
  }

  // --- CONSULTAS ---

  // Trae la lista de computadores
  async getComputers(criteria: DeviceCriteria): Promise<Computer[]> {
    const opts = buildFindOptions(criteria);
    const list = await this.em.find(ComputerEntity, opts.where, {
      orderBy: opts.orderBy,
      limit: opts.limit,
      offset: opts.offset,
    });

    return list.map(e => ({
      id: e.id,
      brand: e.brand,
      model: e.model,
      color: e.color,
      photoURL: new URL(e.photoURL),
      owner: { id: e.ownerId, name: e.ownerName },
      checkinAt: e.checkinAt ?? undefined,
      checkoutAt: e.checkoutAt ?? undefined,
      updatedAt: e.updatedAt,
    }));
  }

  // Trae la lista de dispositivos médicos
  async getMedicalDevices(criteria: DeviceCriteria): Promise<MedicalDevice[]> {
    const opts = buildFindOptions(criteria);
    const list = await this.em.find(MedicalDeviceEntity, opts.where, {
      orderBy: opts.orderBy,
      limit: opts.limit,
      offset: opts.offset,
    });

    return list.map(e => ({
      id: e.id,
      brand: e.brand,
      model: e.model,
      photoURL: new URL(e.photoURL),
      owner: { id: e.ownerId, name: e.ownerName },
      serial: e.serial,
      checkinAt: e.checkinAt ?? undefined,
      checkoutAt: e.checkoutAt ?? undefined,
      updatedAt: e.updatedAt,
    }));
  }

  // Trae la lista de computadores frecuentes
  async getFrequentComputers(criteria: DeviceCriteria): Promise<FrequentComputer[]> {
    const opts = buildFindOptions(criteria);
    const list = await this.em.find(FrequentComputerEntity, opts.where, {
      orderBy: opts.orderBy,
      limit: opts.limit,
      offset: opts.offset,
    });

    return list.map(e => ({
      device: {
        id: e.id,
        brand: e.brand,
        model: e.model,
        photoURL: new URL(e.photoURL),
        owner: { id: e.ownerId, name: e.ownerName },
        checkinAt: e.lastCheckinAt ?? undefined,
        checkoutAt: e.lastCheckoutAt ?? undefined,
        updatedAt: e.updatedAt,
      },
      checkinURL: new URL(`/devices/${e.id}/checkin`, "http://localhost:3000"),
      checkoutURL: new URL(`/devices/${e.id}/checkout`, "http://localhost:3000"),
    }));
  }

  // Trae todos los dispositivos ingresados
  async getEnteredDevices(criteria: DeviceCriteria): Promise<EnteredDevice[]> {
    const computers = await this.getComputers(criteria);
    const medicals = await this.getMedicalDevices(criteria);
    const frequents = await this.getFrequentComputers(criteria);

    return [
      ...computers.filter(c => c.checkinAt && !c.checkoutAt).map(c => ({
        ...c,
        type: "computer" as const,
      })),
      ...medicals.filter(m => m.checkinAt && !m.checkoutAt).map(m => ({
        ...m,
        type: "medical-device" as const,
      })),
      ...frequents.filter(f => f.device.checkinAt && !f.device.checkoutAt).map(f => ({
        ...f.device,
        type: "frequent-computer" as const,
      })),
    ];
  }

  // --- FLAGS ---

  // Registra la salida de un dispositivo
  async checkoutDevice(id: DeviceId, datetime: Date): Promise<void> {
    const comp = await this.em.findOne(ComputerEntity, { id });
    if (comp) {
      comp.checkoutAt = datetime;
      comp.updatedAt = new Date();
      await this.em.persistAndFlush(comp);
      return;
    }

    const med = await this.em.findOne(MedicalDeviceEntity, { id });
    if (med) {
      med.checkoutAt = datetime;
      med.updatedAt = new Date();
      await this.em.persistAndFlush(med);
      return;
    }

    const freq = await this.em.findOne(FrequentComputerEntity, { id });
    if (freq) {
      freq.lastCheckoutAt = datetime;
      freq.updatedAt = new Date();
      await this.em.persistAndFlush(freq);
    }
  }

  // Verifica si un dispositivo está ingresado
  async isDeviceEntered(id: DeviceId): Promise<boolean> {
    const comp = await this.em.findOne(ComputerEntity, { id });
    if (comp && comp.checkinAt && !comp.checkoutAt) return true;

    const med = await this.em.findOne(MedicalDeviceEntity, { id });
    if (med && med.checkinAt && !med.checkoutAt) return true;

    const freq = await this.em.findOne(FrequentComputerEntity, { id });
    if (freq && freq.lastCheckinAt && !freq.lastCheckoutAt) return true;

    return false;
  }

  // Verifica si un computador frecuente ya fue registrado
  async isFrequentComputerRegistered(id: DeviceId): Promise<boolean> {
    const freq = await this.em.findOne(FrequentComputerEntity, { id });
    return !!freq;
  }
}

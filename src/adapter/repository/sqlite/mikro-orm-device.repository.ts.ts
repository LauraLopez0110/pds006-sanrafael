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

// ⚡ Helper: transforma DeviceCriteria en filtros MikroORM
function buildFindOptions(criteria: DeviceCriteria): {
  where: Record<string, unknown>;
  limit?: number;
  offset?: number;
  orderBy?: Record<string, "asc" | "desc">;
} {
  const where: Record<string, unknown> = {};
  const opts: any = { where };

  if (criteria.filterBy) {
    where[criteria.filterBy.field] = criteria.filterBy.value;
  }

  if (criteria.limit) opts.limit = criteria.limit;
  if (criteria.offset) opts.offset = criteria.offset;

  if (criteria.sortBy) {
    opts.orderBy = {
      [criteria.sortBy.field]: criteria.sortBy.isAscending ? "asc" : "desc",
    };
  } else {
    opts.orderBy = { updatedAt: "desc" };
  }

  return opts;
}

export class MikroOrmDeviceRepository implements DeviceRepository {
  constructor(private readonly em: EntityManager) {}

  // --- REGISTROS ---

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

  async isDeviceEntered(id: DeviceId): Promise<boolean> {
    const comp = await this.em.findOne(ComputerEntity, { id });
    if (comp && comp.checkinAt && !comp.checkoutAt) return true;

    const med = await this.em.findOne(MedicalDeviceEntity, { id });
    if (med && med.checkinAt && !med.checkoutAt) return true;

    const freq = await this.em.findOne(FrequentComputerEntity, { id });
    if (freq && freq.lastCheckinAt && !freq.lastCheckoutAt) return true;

    return false;
  }

  async isFrequentComputerRegistered(id: DeviceId): Promise<boolean> {
    const freq = await this.em.findOne(FrequentComputerEntity, { id });
    return !!freq;
  }
}

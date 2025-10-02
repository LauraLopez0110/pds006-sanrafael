import { Computer, DeviceCriteria, DeviceId, EnteredDevice, FrequentComputer, MedicalDevice } from "@/core/domain";
import { DeviceRepository } from "@/core/repository";
import { SERVICE_ERRORS } from "@/core/service/error";

export class InMemoryDeviceRepository  implements DeviceRepository{
    private computers: Map<DeviceId, Computer> = new Map()
    private medicalDevices: Map<DeviceId, MedicalDevice> = new Map()    
    private enteredDevices: Map<DeviceId, EnteredDevice> = new Map()
    private frequentComputers: Map<DeviceId, FrequentComputer> = new Map()

    constructor() {}

    async getComputers(criteria: DeviceCriteria): Promise<Computer[]> {
        return Array.from(this.computers.values())
    }

    async getMedicalDevices(criteria: DeviceCriteria): Promise<MedicalDevice[]> {
        return Array.from(this.medicalDevices.values())
    }

    async registerFrequentComputer(computer: FrequentComputer): Promise<FrequentComputer> {
        this.frequentComputers.set(computer.device.id, computer)
        return computer
    }

    async getFrequentComputers(criteria: DeviceCriteria): Promise<FrequentComputer[]> {
        return Array.from(this.frequentComputers.values())
    }

    async getEnteredDevices(criteria: DeviceCriteria): Promise<EnteredDevice[]> {
        return Array.from(this.enteredDevices.values())
    }

    async checkinComputer(computer: Computer): Promise<Computer> {
        this.computers.set(computer.id, computer)
        this.enteredDevices.set(computer.id, this.mapDiviceFromComputer(computer))
        return computer
        
    }
    async checkinMedicalDevice(device: MedicalDevice): Promise<MedicalDevice> {
        this.medicalDevices.set(device.id, device)
        this.enteredDevices.set(device.id, this.mapDeviceFromMedicalDevice(device))
        return device
    }
    async checkinFrequentComputer(id: DeviceId, datetime: Date): Promise<FrequentComputer> {
        if(!this.frequentComputers.has(id)) {
            throw SERVICE_ERRORS.DeviceNotFound
        }
       const computer = this.frequentComputers.get(id)!
       computer.device.updatedAt = datetime

        this.enteredDevices.set(id, this.mapDeviceFromFrequentComputer(computer))
        return computer
    }
       
    async checkoutDevice(id: DeviceId, datetime: Date): Promise<void> {
        if(!this.enteredDevices.has(id)) {
            throw SERVICE_ERRORS.DeviceNotFound
        }
        const device = this.enteredDevices.get(id)!
        switch (device.type) {
            case "computer":
                this.computers.get(id)!.checkinAt = datetime
                break;
            case "medical-device":
                this.medicalDevices.get(id)!.checkinAt = datetime
                break;
            case "frequent-computer":
                this.frequentComputers.get(id)!.device.checkinAt = datetime
                break;
        }
        this.enteredDevices.delete(id)
    }

    async isDeviceEntered(id: DeviceId): Promise<boolean> {
        return this.enteredDevices.has(id)
    }
    async isFrequentComputerRegistered(id: DeviceId): Promise<boolean> {
        return this.frequentComputers.has(id)
    }

    private mapDeviceFromFrequentComputer(computer: FrequentComputer): EnteredDevice {
        return {
            id: computer.device.id,
            brand: computer.device.brand,
            model: computer.device.model,
            owner: computer.device.owner,
            updatedAt: new Date(),
            checkinAt: new Date(),
            type: 'frequent-computer'
         
        }
    }

    private mapDeviceFromMedicalDevice(device: MedicalDevice): EnteredDevice {
        return {
            id: device.id,
            brand: device.brand,
            model: device.model,
            owner: device.owner,
            updatedAt: new Date(),
            checkinAt: new Date(),
            type: 'medical-device'
        }
    }
    private mapDiviceFromComputer(computer: Computer): EnteredDevice {
        return {
            id: computer.id,
            brand: computer.brand,
            model: computer.model,
            owner: computer.owner,
            updatedAt: new Date(),
            checkinAt: new Date(),
            type: 'computer'
            
        }
    }
}
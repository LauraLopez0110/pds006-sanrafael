import openapi from '@elysiajs/openapi';
import { Controller } from './controller';
import { ComputerService, DeviceService, MedicalDeviceService } from '@/core/service';
import Elysia from 'elysia';
export class ElysiaAdapter {
    private controller: Controller

    constructor(
        computerService: ComputerService,
        deviceService: DeviceService,
        medicalDeviceService: MedicalDeviceService
    ) {
        this.controller = new Controller(
            computerService,
            deviceService,
            medicalDeviceService
        )
    }

    async run() {
        const app = new Elysia()
            .use(openapi({}))
            .use(this.controller.routes())
            .listen(3000)

        console.log("El servidor esta corriendo en el puerto 3000")
    }
}
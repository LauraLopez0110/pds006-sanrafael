import { ComputerService, DeviceService, MedicalDeviceService } from '@/core/service';
import Elysia from 'elysia';
import { CRITERIA_QUERY_PARAMS_SCHEMA, CriteriaHelper, CriteriaQueryParams } from './criteria.helper';
import { COMPUTER_REQUEST_SCHEMA, ComputerRequest, MED_DEVICE_REQUEST_SCHEMA, MedDeviceRequest } from '@/core/dto';
import * as z from 'zod';
export class Controller {
    constructor(
        private computerService: ComputerService,
        private deviceService: DeviceService,
        private medicalDeviceService: MedicalDeviceService
    ) {}

    public routes() {
        return new Elysia({
            prefix: '/api',
        })

            .guard({
                query: CRITERIA_QUERY_PARAMS_SCHEMA
            })
            .post(
                "/computers/checkin",
                ({ body }) => this.checkinComputer(body),
                {
                    type: "multipart/form-data",
                    body: COMPUTER_REQUEST_SCHEMA
                }
            )
            .post(
                "/medicaldevices/checkin",
                ({ body }) => this.checkinMedicalDevice(body),
                {
                    body: MED_DEVICE_REQUEST_SCHEMA
                }
            )
            .post(
                "/computers/frequent",
                ({ body }) => this.registerFrequentComputer(body),
                {
                    body: COMPUTER_REQUEST_SCHEMA
                }
            )
            .get(
                "/computers",
                ({ query }) => this.getComputers(query)
            )
            .get(
                "/computers/frequent",
                ({ query }) => this.getFrequentComputers(query)
            )
            .get(
                "/devices/entered",
                ({ query }) => this.getEnteredDevices(query)
            )
            .guard({
                params: z.object({
                    id: z.uuid()
                })
            })
            .patch(
                "/computers/frequent/checkin/:id",
                ({ params: {id}}) => this.checkinFrecuentComputer(id)
            )
            .patch(
                "/devices/checkout/:id",
                ({ params: {id}}) => this.checkoutDevice(id)
            );
            
    }

    async checkinComputer( request: ComputerRequest){
        return this.computerService.checkinComputer(request);
    }

    async checkinFrecuentComputer(id: string){
        return this.computerService.checkinFrequentComputer(id);
    }

    async checkinMedicalDevice( request: MedDeviceRequest){
        return this.medicalDeviceService.checkinMedicalDevice(request);
    }

    async registerFrequentComputer(request: ComputerRequest){
        return this.computerService.registerFrequentComputer(request);
    }

    async getComputers(queryParams: CriteriaQueryParams){
        const criteria = CriteriaHelper.parseFromQuery(queryParams);
        return this.computerService.getComputers(criteria);
    }

    async getFrequentComputers(queryParams: CriteriaQueryParams){
        const criteria = CriteriaHelper.parseFromQuery(queryParams);
        return this.computerService.getFrequentComputers(criteria);
    }

    async getEnteredDevices(queryParams: CriteriaQueryParams){
        const criteria = CriteriaHelper.parseFromQuery(queryParams);
        return this.deviceService.getEnteredDevices(criteria);
    }

    async checkoutDevice(id: string){
        return this.deviceService.checkoutDevice(id);
    }
}
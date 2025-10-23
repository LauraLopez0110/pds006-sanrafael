import { InMemoryDeviceRepository } from "./adapter";
import { ElysiaAdapter } from "./adapter/api/elysia";
import { FilesystemPhotoRepository } from "./adapter/photo/filesystem/filesystem.photo-repository";
import { ComputerService, DeviceService, MedicalDeviceService } from "./core/service";

const deviceRepository = new InMemoryDeviceRepository()
const photoRepository = new FilesystemPhotoRepository()

const computerService = new ComputerService(
    deviceRepository, 
    photoRepository, 
    new URL("http://localhost:3000/api")
)

const deviceService = new DeviceService(deviceRepository)

const medicalDeviceService = new MedicalDeviceService(
    deviceRepository,
    photoRepository
)

const app = new ElysiaAdapter(
    computerService,
    deviceService,
    medicalDeviceService
)

app.run()
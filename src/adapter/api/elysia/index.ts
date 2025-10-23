import openapi from '@elysiajs/openapi';
import { Controller } from './controller';
import { ComputerService, DeviceService, MedicalDeviceService } from '@/core/service';
import { FilesystemPhotoRepository } from '@/adapter/photo/filesystem/filesystem.photo-repository'; 
import Elysia from 'elysia';

export class ElysiaAdapter {
    private controller: Controller;
    private photoRepository: FilesystemPhotoRepository;
    public app: Elysia

    constructor(
        computerService: ComputerService,
        deviceService: DeviceService,
        medicalDeviceService: MedicalDeviceService
    ) {
        this.controller = new Controller(
            computerService,
            deviceService,
            medicalDeviceService
        );

        // 📸 Instancia del repositorio de fotos (temporalmente aquí)
        this.photoRepository = new FilesystemPhotoRepository();

        this.app= new Elysia()
            .use(openapi())
            .use(this.controller.routes())
    }

    async run() {
        // ==========================================================
        // 📸 INICIO: RUTAS DE FOTOS (subida manual de imágenes)
        // ----------------------------------------------------------
        // ⚠️ Estas rutas se colocan aquí solo de forma temporal.
        // Si luego se integran al Controller o a los servicios,
        // puedes mover todo este bloque allá sin romper la app.
        // ----------------------------------------------------------
        this.app.post('/upload', async ({ request }) => {
            try {
                const form = await request.formData();
                const file = form.get('file') as File;
                const deviceId = (form.get('deviceId') as string) || 'unknown-device';

                if (!file) {
                    return new Response('No se envió ningún archivo', { status: 400 });
                }

                const url = await this.photoRepository.savePhoto(file, deviceId);

                return new Response(
                    JSON.stringify({ ok: true, url: url.href }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            } catch (err) {
                console.error('Error al subir la foto:', err);
                return new Response('Error interno del servidor', { status: 500 });
            }
        });
        // 📸 FIN: RUTAS DE FOTOS
        // ==========================================================

        this.app.listen(3000)
        console.log('🚀 El servidor está corriendo en el puerto 3000');
    }
}

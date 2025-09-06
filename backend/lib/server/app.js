import { Server, db} from './server.js';

export async function createApp() {
    const server = new Server();
    await server.bootstrap();
    server.loadServer();
    return { app: server.app, db: db };
}
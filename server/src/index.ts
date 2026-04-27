import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import { conectarBanco } from './config/database.js';
import { routes } from './routes.js';
import { CicloServices } from './services/cicloServices.js'; 

const app = express();
const PORT = 3000;

/** * Configuração de Middleware: Habilita compartilhamento de recursos (CORS) e parsing de JSON 
 */
app.use(cors());
app.use(express.json());

/** * Exposição de diretório estático para armazenamento e recuperação de assets (ex: fotos de perfil) 
 */
app.use('/public', express.static('public'));

/** * Injeção do módulo central de rotas da aplicação 
 */
app.use(routes);

/**
 * Orquestração da inicialização da aplicação.
 * Garante a conectividade com a camada de persistência antes da abertura do socket TCP.
 */
async function iniciarServidor() {
    try {
        await conectarBanco();
        
        /** * Escuta em '0.0.0.0' para permitir acessos externos em ambientes containerizados ou deploys Cloud 
         */
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor ON: http://localhost:${PORT}`);
        });

        /**
         * Rotina de agendamento (Cron Job): Execução diária às 00:01.
         * Aciona o pipeline de encerramento de ciclos expirados para garantir a integridade temporal do sistema.
         */
        cron.schedule('1 0 * * *', async () => {
            console.log('⏳ [00:01] Iniciando varredura automática de ciclos vencidos...');
            try {
                const cicloService = new CicloServices();
                await cicloService.encerrarCyclesVencidos();
                console.log('✅ Varredura concluída!');
            } catch (erro) {
                console.error('❌ Erro na rotina automática:', erro);
            }
        });

    } catch (erro) {
        console.error("Erro fatal na inicialização do serviço:", erro);
    }
}

iniciarServidor();

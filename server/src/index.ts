import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { conectarBanco } from './config/database.js';
import { routes } from './routes.js';
import { CicloServices } from './services/cicloServices.js'; 

const app = express();

/** * Porta dinâmica para ambientes Cloud (Railway, Render, etc) com fallback local 
 */
const PORT = process.env.PORT || 3000;

/** * Necessário para resolver __dirname em ESM (NodeNext) 
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** * Configuração de Middleware: Habilita compartilhamento de recursos (CORS) e parsing de JSON 
 */
app.use(cors());
app.use(express.json());

/** * Exposição de diretório estático para armazenamento e recuperação de assets (ex: fotos de perfil) 
 * Caminho absoluto evita erro em ambiente de build (dist)
 */
app.use('/public', express.static(path.join(__dirname, '../public')));

/** * Rota de healthcheck para monitoramento e prevenção de cold start 
 */
app.get('/health', (req, res) => {
    res.status(200).send('ok');
});

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
            console.log(`Servidor ON na porta ${PORT}`);
        });

        /**
         * Rotina de agendamento (Cron Job): Execução diária às 00:01.
         * Aciona o pipeline de encerramento de ciclos expirados para garantir a integridade temporal do sistema.
         * Timezone explícito evita inconsistência entre ambientes
         */
        cron.schedule('1 0 * * *', async () => {
            console.log('[00:01] Iniciando varredura automática de ciclos vencidos...');
            try {
                const cicloService = new CicloServices();
                await cicloService.encerrarCyclesVencidos();
                console.log('Varredura concluída!');
            } catch (erro) {
                console.error('Erro na rotina automática:', erro);
            }
        }, {
            timezone: "America/Sao_Paulo"
        });

    } catch (erro) {
        console.error("Erro fatal na inicialização do serviço:", erro);
        process.exit(1);
    }
}

iniciarServidor();

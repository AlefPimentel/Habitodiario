import { Router } from 'express';
import { PerfilController } from './controllers/perfilController.js';
import { HabitoController } from './controllers/habitoController.js';
import { CicloController } from './controllers/cicloController.js';
import { HistoricoController } from './controllers/historicoController.js';
import { EstatisticaController } from './controllers/estatisticaController.js';

const routes = Router();

/** * Instanciação dos controllers para manipulação de contextos específicos 
 */
const perfilController = new PerfilController();
const habitoController = new HabitoController();
const cicloController = new CicloController();
const historicoController = new HistoricoController();
const estatisticaController = new EstatisticaController();

/**
 * Contexto: PERFIS
 * Operações de gerenciamento de conta, autenticação e metadados de usuário.
 */
routes.post('/perfis', (req, res) => perfilController.criar(req, res));
routes.post('/login', (req, res) => perfilController.login(req, res));
routes.get('/perfis/:id', (req, res) => perfilController.buscarPorId(req, res));
routes.patch('/perfis/:id', (req, res) => perfilController.atualizar(req, res));

/**
 * Contexto: HABITOS
 * Gestão de definições de tarefas e registros de conclusão (Modo Ativo e Replay).
 */
routes.post('/habitos', (req, res) => habitoController.criar(req, res));
routes.get('/habitos/:cicloId/:perfilId', (req, res) => habitoController.listar(req, res));
routes.patch('/habitos/alternar', (req, res) => habitoController.alternar(req, res));
routes.get('/habitos/historico/:historicoId/:perfilId', (req, res) => habitoController.listarHistorico(req, res)); 

/**
 * Contexto: CICLOS
 * Fluxo de vida de jornadas: criação, adesão via convite e encerramento.
 */
routes.post('/ciclos/iniciar', (req, res) => cicloController.iniciar(req, res));
routes.post('/ciclos/entrar', (req, res) => cicloController.entrar(req, res)); 
routes.post('/ciclos/abortar', (req, res) => cicloController.abortar(req, res)); 
routes.get('/ciclos/detalhes/:id', (req, res) => cicloController.buscarPorId(req, res));
routes.get('/ciclos/hoje/:perfilId', (req, res) => cicloController.buscarHoje(req, res));
routes.get('/ciclos/historico/:perfilId', (req, res) => cicloController.listarParaGraficos(req, res));

/**
 * Contexto: HISTÓRICO E ESTATÍSTICAS
 * Recuperação de dados arquivados e métricas de desempenho processadas (Read Models).
 */
routes.get('/historico/:perfilId', (req, res) => historicoController.listar(req, res));
routes.get('/historico/detalhes/:id', (req, res) => historicoController.buscarDetalhes(req, res)); 
routes.get('/estatisticas/:perfilId', (req, res) => estatisticaController.listar(req, res));

export { routes };

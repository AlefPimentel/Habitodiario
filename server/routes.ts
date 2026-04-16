import { Router } from 'express';
import { PerfilController } from './controllers/perfilController.js';
import { HabitoController } from './controllers/habitoController.js';
import { CicloController } from './controllers/cicloController.js';

const routes = Router();

const perfilController = new PerfilController();
const habitoController = new HabitoController();
const cicloController = new CicloController();

// --- Perfil ---
routes.post('/perfis', (req, res) => perfilController.criar(req, res));
routes.post('/login', (req, res) => perfilController.login(req, res));
routes.get('/perfis/:id', (req, res) => perfilController.buscarPorId(req, res));

// --- Hábitos (Independente de Ciclo) ---
routes.post('/habitos', (req, res) => habitoController.criar(req, res));
routes.get('/habitos/:perfilId', (req, res) => habitoController.listar(req, res));
routes.patch('/habitos/:id/alternar', (req, res) => habitoController.alternar(req, res));

// --- Ciclos ---
routes.post('/ciclos/iniciar', (req, res) => cicloController.iniciar(req, res));
routes.post('/ciclos/entrar', (req, res) => cicloController.entrar(req, res)); 
routes.get('/ciclos/detalhes/:id', (req, res) => cicloController.buscarPorId(req, res));
routes.get('/ciclos/hoje/:perfilId', (req, res) => cicloController.buscarHoje(req, res));
routes.get('/ciclos/historico/:perfilId', (req, res) => cicloController.listarParaGraficos(req, res));

export { routes };


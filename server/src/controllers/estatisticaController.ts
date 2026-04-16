import type { Request, Response } from 'express';
import { EstatisticaServices } from '../services/estatisticaServices.js';

const estatisticaService = new EstatisticaServices();

export class EstatisticaController {
    /**
     * Recupera a coleção de estatísticas processadas vinculadas a um perfil específico.
     * Endpoint: GET /estatisticas/:perfilId
     */
    async listar(req: Request, res: Response) {
        try {
            const { perfilId } = req.params;
            const lista = await estatisticaService.listarPorUsuario(perfilId);
            return res.status(200).json(lista);
        } catch (error: any) {
            /** * Erro 500 para falhas na camada de persistência ou lógica de agregação 
             */
            return res.status(500).json({ error: error.message });
        }
    }
}

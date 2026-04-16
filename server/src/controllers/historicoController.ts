import type { Request, Response } from 'express';
import { HistoricoServices } from '../services/historicoServices.js'; 

const historicoService = new HistoricoServices();

export class HistoricoController {
    /**
     * Recupera a coleção de registros históricos vinculados a um perfil.
     * Endpoint: GET /historico/:perfilId
     */
    async listar(req: Request, res: Response) {
        try {
            const { perfilId } = req.params;
            const lista = await historicoService.listarPorUsuario(perfilId);
            return res.status(200).json(lista);
        } catch (error: any) {
            /** * Retorno de erro 500 para falhas na camada de serviço ou conexão com o cluster 
             */
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Recupera a projeção detalhada de um registro histórico, incluindo agregação com estatísticas.
     * Endpoint: GET /historico/detalhes/:id
     */
    async buscarDetalhes(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const detalhes = await historicoService.buscarDetalhes(id);
            return res.status(200).json(detalhes);
        } catch (error: any) {
            /** * Erro 404 em caso de ID inexistente ou falha na agregação de documentos 
             */
            return res.status(404).json({ error: error.message });
        }
    }
}

import type { Request, Response } from 'express';
import { HabitoServices } from '../services/habitoServices.js';
import { CicloServices } from '../services/cicloServices.js';

const habitoService = new HabitoServices();
const cicloService = new CicloServices();

export class HabitoController {
    
    /**
     * Persiste uma nova definição de hábito atrelada a um ciclo ativo.
     * Requer: nome, cicloId.
     */
    async criar(req: Request, res: Response) {
        try {
            const { nome, cicloId } = req.body;
            if (!nome || !cicloId) return res.status(400).json({ erro: "Dados insuficientes." });

            const resultado = await habitoService.criarDefinicao(nome, cicloId);
            return res.status(201).json(resultado);
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }

    /**
     * Lista hábitos com status de conclusão semanal.
     * Utiliza offset para navegação entre blocos de 7 dias a partir da data de criação do ciclo.
     */
    async listar(req: Request, res: Response) {
        try {
            const { cicloId, perfilId } = req.params;
            const offset = parseInt(req.query.offset as string) || 0;
            
            const habitosComStatus = await habitoService.listarComStatusSemanal(cicloId, perfilId, offset);
            return res.status(200).json(habitosComStatus);
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }

    /**
     * Gerencia a alternância de estado (check-in) de um hábito para a data atual.
     * Implementa lógica de incremento no contador de conclusões do ciclo caso o registro seja novo.
     */
    async alternar(req: Request, res: Response) {
        try {
            const { habitoId, perfilId, cicloId } = req.body;
            
            if (!habitoId || !perfilId || !cicloId) {
                return res.status(400).json({ erro: "ID do hábito, perfil ou ciclo faltando." });
            }

            const status = await habitoService.alternarRegistro(habitoId, perfilId);

            /** * Condicional: Incrementa métricas do ciclo apenas se a operação resultar em nova inserção 
             */
            if (status === "marcou_agora") {
                await cicloService.registrarConclusao(cicloId, perfilId, 'diario');
                return res.status(200).json({ concluido: true });
            }
            
            return res.status(200).json({ concluido: true, aviso: "Já estava marcado no banco." });
        } catch (erro: any) { 
            return res.status(400).json({ erro: erro.message }); 
        }
    }

    /**
     * Recupera o estado histórico de hábitos de um ciclo já encerrado (Modo Replay).
     * Mapeia registros da coleção de histórico baseando-se no ID da âncora do histórico.
     */
    async listarHistorico(req: Request, res: Response) {
        try {
            const { historicoId, perfilId } = req.params;
            const offset = parseInt(req.query.offset as string) || 0;
            
            const habitosComStatus = await habitoService.listarParaHistorico(historicoId, perfilId, offset);
            return res.status(200).json(habitosComStatus);
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }
}

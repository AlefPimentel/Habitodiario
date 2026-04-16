import type { Request, Response } from 'express';
import { CicloServices } from '../services/cicloServices.js';

const cicloService = new CicloServices();

export class CicloController {
    /**
     * Calcula a diferença cronológica em dias entre a data de gênese do ciclo e a data atual.
     * Normaliza as horas para garantir precisão no cálculo de dias corridos.
     */
    private calcularDiaAtual(dataInicioStr: Date): number {
        const dataInicio = new Date(dataInicioStr);
        const hoje = new Date();
        
        dataInicio.setHours(0, 0, 0, 0);
        hoje.setHours(0, 0, 0, 0);

        const diffInMs = hoje.getTime() - dataInicio.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        return diffInDays + 1;
    }

    /**
     * Orquestra a criação de um novo ciclo de hábitos.
     * Define a duração padrão de 30 dias caso o parâmetro seja omitido no payload.
     */
    async iniciar(req: Request, res: Response) {
        try {
            const { nome, perfilId, duracao } = req.body;
            const valorDuracao = duracao === undefined ? 30 : duracao;
            const resultado = await cicloService.iniciarCiclo(nome, perfilId, valorDuracao);
            return res.status(201).json({ id: resultado.insertedId });
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }

    /**
     * Realiza o ingresso de um perfil em um ciclo existente via código de convite.
     * Implementa a lógica de clonagem de ciclo para persistência individualizada.
     */
    async entrar(req: Request, res: Response) {
        try {
            const { codigoConvite, perfilId } = req.body;
            const sucesso = await cicloService.entrarNoCiclo(codigoConvite, perfilId);
            if (sucesso) return res.status(200).json({ mensagem: "Entrou e gerou o ciclo individual!" });
            return res.status(404).json({ erro: "Código inválido." });
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }

    /**
     * Recupera o estado detalhado de um ciclo por ID.
     * Realiza agregação de dados dos participantes (ciclos irmãos) para cálculo de progresso social.
     */
    async buscarPorId(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const ciclo = await cicloService.buscarPorId(id);
            if (!ciclo) return res.status(404).json({ erro: "Ciclo não encontrado." });

            const diaAtual = this.calcularDiaAtual(ciclo.data);
            const ciclosIrmaos = await cicloService.buscarCiclosPorConvite(ciclo.codigoConvite);

            /** * Processamento assíncrono paralelo para mapeamento de progresso dos pares 
             */
            const participantesComProgresso = await Promise.all(
                ciclosIrmaos.map(async (cicloAmigo: any) => {
                    const pId = cicloAmigo.participantes[0].toString();
                    const porcentagem = await cicloService.calcularProgressoHoje(cicloAmigo._id.toString(), pId);
                    return { perfilId: pId, porcentagemHoje: porcentagem };
                })
            );

            return res.status(200).json({ 
                ...ciclo, 
                diaAtual, 
                progressoParticipantes: participantesComProgresso 
            });
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }

    /**
     * Lista todos os ciclos ativos vinculados ao perfil para a data de competência atual.
     * Injeta metadados de progresso e lista completa de participantes do grupo de convite.
     */
    async buscarHoje(req: Request, res: Response) {
        try {
            const { perfilId } = req.params;
            const ciclos = await cicloService.buscarCiclosDeHoje(perfilId, new Date());
            
            if (!ciclos || ciclos.length === 0) return res.status(200).json([]);

            const ciclosComProgresso = await Promise.all(
                ciclos.map(async (ciclo: any) => {
                    const porcentagem = await cicloService.calcularProgressoHoje(ciclo._id.toString(), perfilId);
                    const diaAtual = this.calcularDiaAtual(ciclo.data);
                    
                    const ciclosIrmaos = await cicloService.buscarCiclosPorConvite(ciclo.codigoConvite);
                    const todosParticipantes = ciclosIrmaos.map(c => c.participantes[0].toString());

                    return { 
                        ...ciclo, 
                        participantes: todosParticipantes, 
                        porcentagemHoje: porcentagem, 
                        diaAtual 
                    };
                })
            );

            return res.status(200).json(ciclosComProgresso);
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }

    /**
     * Recupera séries temporais de conclusão de ciclos para alimentação de componentes de visualização de dados.
     */
    async listarParaGraficos(req: Request, res: Response) {
        try {
            const hist = await cicloService.listarDadosParaGrafico(req.params.perfilId);
            const histProcessado = hist.map(ciclo => ({
                ...ciclo,
                diaAtual: this.calcularDiaAtual(ciclo.data)
            }));
            return res.status(200).json(histProcessado);
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }

    /**
     * Interrompe o ciclo ativo prematuramente por solicitação do usuário.
     * Aciona o pipeline de arquivamento (Histórico) e geração de métricas finais (Estatística).
     */
    async abortar(req: Request, res: Response) {
        try {
            const { cicloId, perfilId } = req.body;
            if (!cicloId || !perfilId) return res.status(400).json({ erro: "Dados insuficientes." });
            
            await cicloService.encerrarCicloManualmente(cicloId, perfilId);
            return res.status(200).json({ mensagem: "Ciclo encerrado e arquivado com sucesso!" });
        } catch (erro: any) { 
            return res.status(500).json({ erro: erro.message }); 
        }
    }
}

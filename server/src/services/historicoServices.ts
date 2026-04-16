import { ObjectId } from 'mongodb';
import { conectarBanco } from '../config/database.js';
import { Historico } from '../models/Historico.js';

export class HistoricoServices {
    private collectionName = 'historicos';

    /**
     * Persiste o snapshot imutável de um ciclo finalizado.
     * Converte identificadores de string para BSON ObjectId para integridade referencial.
     */
    async finalizarCiclo(dados: any) {
        const db = await conectarBanco();
        const novoHistorico = new Historico(dados);

        const documento = {
            cicloId: new ObjectId(novoHistorico.cicloId),
            perfilId: new ObjectId(novoHistorico.perfilId),
            nomeCiclo: novoHistorico.nomeCiclo,
            dataInicio: novoHistorico.dataInicio,
            dataFim: novoHistorico.dataFim, 
            participantes: novoHistorico.participantes.map((id: string) => new ObjectId(id))
        };

        return await db.collection(this.collectionName).insertOne(documento);
    }

    /**
     * Recupera históricos realizando um enriquecimento (manual join) com a coleção de estatísticas.
     * Utiliza Promise.all para otimização de requisições concorrentes ao banco.
     */
    async listarPorUsuario(perfilId: string) {
        const db = await conectarBanco();

        const historicos = await db.collection(this.collectionName)
            .find({ perfilId: new ObjectId(perfilId) })
            .sort({ dataFim: -1 })
            .toArray();

        const historicosCompletos = await Promise.all(
            historicos.map(async (hist) => {
                /** * Agregação pontual de metadados de estatística vinculados ao histórico 
                 */
                const estatistica = await db.collection('estatisticas')
                    .findOne({ historicoId: hist._id.toString() });

                return {
                    ...hist,
                    estatistica: estatistica || null 
                };
            })
        );

        return historicosCompletos;
    }

    /**
     * Recupera um documento único de histórico acompanhado de seu respectivo Read Model estatístico.
     */
    async buscarDetalhes(historicoId: string) {
        const db = await conectarBanco();
        
        const historico = await db.collection(this.collectionName).findOne({ _id: new ObjectId(historicoId) });
        if (!historico) throw new Error("Histórico não encontrado");

        const estatistica = await db.collection('estatisticas').findOne({ historicoId: historicoId });
        
        return { ...historico, estatistica };
    }
}

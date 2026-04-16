import { ObjectId } from 'mongodb';
import { conectarBanco } from '../config/database.js';
import { Estatistica } from '../models/Estatistica.js';

export class EstatisticaServices {
    private collectionName = 'estatisticas';

    /**
     * Executa o pipeline de processamento de métricas de desempenho.
     * Realiza o cálculo de eficiência baseado na janela temporal real versus projetada.
     */
    async processarESalvar(dadosBrutos: any) {
        const dataEncerrado = new Date();
        const dataInicio = new Date(dadosBrutos.dataInicio);
        const duracaoTotal = dadosBrutos.duracao;

        /** * Cálculo do delta temporal para determinação do denominador de checks possíveis 
         */
        const diffMs = dataEncerrado.getTime() - dataInicio.getTime();
        let diasCalculados = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
        
        /** * Normalização do limite temporal para evitar extrapolação da duração prevista 
         */
        if (duracaoTotal && diasCalculados > duracaoTotal) diasCalculados = duracaoTotal; 
        const diasCumpridos = diasCalculados > 0 ? diasCalculados : 1;

        /** * Cálculo da taxa de retenção temporal do ciclo 
         */
        let porcentagemConcluida = 100;
        if (duracaoTotal && duracaoTotal > 0) {
            porcentagemConcluida = Math.round((diasCumpridos / duracaoTotal) * 100);
        }

        /** * Algoritmo de eficiência: Relação entre registros atômicos e o potencial de checks do período 
         */
        let porcentagemChecks = 0;
        const checksPossiveis = dadosBrutos.totalHabitos * diasCumpridos;
        if (checksPossiveis > 0) {
            porcentagemChecks = Math.round((dadosBrutos.totalChecks / checksPossiveis) * 100);
            if (porcentagemChecks > 100) porcentagemChecks = 100; 
        }

        /** * Atribuição de score baseada em faixas de percentual de conclusão 
         */
        let nota = 3;
        if (porcentagemChecks >= 90) nota = 10;
        else if (porcentagemChecks >= 70) nota = 8;
        else if (porcentagemChecks >= 50) nota = 6;

        /** * Definição do status de sucesso baseado no threshold de 70% de adesão 
         */
        const concluidoComSucesso = porcentagemChecks >= 70;

        const dadosLiquidos = {
            ...dadosBrutos,
            duracaoTotal, diasCumpridos, porcentagemConcluida,
            porcentagemChecks, nota, concluidoComSucesso
        };

        const novaEstatistica = new Estatistica(dadosLiquidos);
        const db = await conectarBanco();
        return await db.collection(this.collectionName).insertOne(novaEstatistica);
    }

    /**
     * Recupera a coleção de estatísticas do usuário com ordenação cronológica decrescente.
     */
    async listarPorUsuario(perfilId: string) {
        const db = await conectarBanco();
        return await db.collection(this.collectionName)
            .find({ perfilId })
            .sort({ dataEncerrado: -1 })
            .toArray();
    }
}

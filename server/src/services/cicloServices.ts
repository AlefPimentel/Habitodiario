import { ObjectId } from 'mongodb';
import { conectarBanco } from '../config/database.js';
import { Ciclo } from '../models/Ciclo.js';
import { EstatisticaServices } from './estatisticaServices.js';

const estatisticaService = new EstatisticaServices();

export class CicloServices {
    private collectionName = 'ciclos';

    /**
     * Inicializa a persistência de um novo ciclo.
     * Calcula o TTL (Time-To-Live) do documento baseado no parâmetro de duração.
     */
    async iniciarCiclo(nome: string, criadorId: string, duracao: number | null) {
        const novoCiclo = new Ciclo(nome, criadorId, duracao);
        const db = await conectarBanco();
        
        let dataFim = null;
        if (duracao) {
            dataFim = new Date();
            dataFim.setDate(dataFim.getDate() + duracao);
        }

        return await db.collection(this.collectionName).insertOne({
            nome: novoCiclo.nome,
            participantes: [new ObjectId(criadorId)],
            codigoConvite: novoCiclo.codigoConvite,
            data: novoCiclo.data,
            duracao: novoCiclo.duracao,
            dataFim: dataFim, 
            ativa: true,
            checkDiario: novoCiclo.checkDiario,
            checkSemanal: novoCiclo.checkSemanal,
            checkMensal: novoCiclo.checkMensal,
            resumo: novoCiclo.getResumoCiclo()
        });
    }

    /**
     * Implementa a lógica de ingresso via Deep Link/Código.
     * Realiza a clonagem do documento base para garantir o isolamento do progresso individual.
     */
    async entrarNoCiclo(codigo: string, perfilIdAmigo: string) {
        const db = await conectarBanco();
        const codigoFormatado = codigo.toUpperCase();

        const cicloBase = await db.collection(this.collectionName).findOne({ codigoConvite: codigoFormatado });
        if (!cicloBase) return false;

        const jaExiste = await db.collection(this.collectionName).findOne({
            codigoConvite: codigoFormatado,
            participantes: { $in: [new ObjectId(perfilIdAmigo)] }
        });
        if (jaExiste) return true; 

        const cicloClone = new Ciclo(
            cicloBase.nome, 
            perfilIdAmigo, 
            cicloBase.duracao, 
            cicloBase.codigoConvite, 
            cicloBase.data
        );

        await db.collection(this.collectionName).insertOne({
            nome: cicloClone.nome,
            participantes: [new ObjectId(perfilIdAmigo)],
            codigoConvite: cicloClone.codigoConvite,
            data: cicloClone.data,
            duracao: cicloClone.duracao,
            dataFim: cicloBase.dataFim, 
            ativa: true,
            checkDiario: 0, 
            checkSemanal: 0,
            checkMensal: 0,
            resumo: cicloClone.getResumoCiclo()
        });

        return true;
    }

    async buscarPorId(id: string) {
        const db = await conectarBanco();
        return await db.collection(this.collectionName).findOne({ _id: new ObjectId(id) });
    }

    async buscarCiclosPorConvite(codigoConvite: string) {
        const db = await conectarBanco();
        return await db.collection(this.collectionName).find({ codigoConvite }).toArray();
    }

    /**
     * Filtra documentos ativos onde a janela temporal coincide com o timestamp atual.
     * Define limites de início e fim do dia para normalização da busca.
     */
    async buscarCiclosDeHoje(perfilId: string, data: Date) {
        const db = await conectarBanco();
        const inicioDia = new Date(data.setHours(0,0,0,0));
        const fimDia = new Date(data.setHours(23,59,59,999));

        return await db.collection(this.collectionName).find({
            participantes: { $in: [new ObjectId(perfilId)] },
            data: { $lte: fimDia }, 
            $or: [
                { dataFim: null }, 
                { dataFim: { $gte: inicioDia } } 
            ]
        }).toArray();
    }

    /**
     * Realiza o cálculo de eficiência diária.
     * Cruza a contagem total de definições (habitos) com os registros de conclusão atômicos.
     */
    async calcularProgressoHoje(cicloId: string, perfilId: string) {
        const db = await conectarBanco();
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const fimHoje = new Date();
        fimHoje.setHours(23,59,59,999);

        const totalHabitos = await db.collection('habitos').countDocuments({ 
            cicloId: new ObjectId(cicloId) 
        });

        if (totalHabitos === 0) return 0;

        const habitosDoCiclo = await db.collection('habitos')
            .find({ cicloId: new ObjectId(cicloId) }, { projection: { _id: 1 } })
            .toArray();
        
        const habitosIds = habitosDoCiclo.map(h => h._id);

        const concluidosHoje = await db.collection('registros').countDocuments({
            perfilId: new ObjectId(perfilId),
            habitoId: { $in: habitosIds },
            data: { $gte: hoje, $lte: fimHoje }
        });

        return Math.round((concluidosHoje / totalHabitos) * 100);
    }

    /**
     * Realiza o incremento atômico nos contadores de conclusão do documento.
     */
    async registrarConclusao(id: string, perfilId: string, tipo: 'diario' | 'semanal' | 'mensal') {
        const db = await conectarBanco();
        const campo = tipo === 'diario' ? 'checkDiario' : tipo === 'semanal' ? 'checkMensal' : 'checkMensal';

        return await db.collection(this.collectionName).updateOne(
            { _id: new ObjectId(id), participantes: { $in: [new ObjectId(perfilId)] } },
            { $inc: { [campo]: 1 } } 
        );
    }

    async listarDadosParaGrafico(perfilId: string, limite: number = 30) {
        const db = await conectarBanco();
        return await db.collection(this.collectionName)
            .find({ participantes: { $in: [new ObjectId(perfilId)] } })
            .sort({ data: -1 }).limit(limite).toArray();
    }

    /**
     * Pipeline de encerramento manual.
     * Executa o arquivamento em 'historicos', processa métricas finais em 'estatisticas' 
     * e remove o documento da coleção ativa (ciclos).
     */
    async encerrarCicloManualmente(cicloId: string, perfilId: string) {
        const db = await conectarBanco();
        
        const ciclo = await db.collection(this.collectionName).findOne({ 
            _id: new ObjectId(cicloId),
            participantes: { $in: [new ObjectId(perfilId)] }
        });

        if (!ciclo) throw new Error("Ciclo não encontrado ou acesso negado.");

        const habitosDoCiclo = await db.collection('habitos').find({ cicloId: ciclo._id }).toArray();
        const totalHabitos = habitosDoCiclo.length;
        const habitosIds = habitosDoCiclo.map(h => h._id);

        const insertHistorico = await db.collection('historicos').insertOne({
            cicloId: ciclo._id,
            perfilId: new ObjectId(perfilId),
            nomeCiclo: ciclo.nome,
            dataInicio: ciclo.data,
            dataFim: ciclo.dataFim, 
            participantes: ciclo.participantes
        });

        const registros = await db.collection('registros').find({
            perfilId: new ObjectId(perfilId),
            habitoId: { $in: habitosIds }
        }).toArray();

        /** * Agregação de registros para cálculo de 'Dias Perfeitos' (Eficácia 100%) 
         */
        const checksPorDia: { [data: string]: number } = {};
        for (const reg of registros) {
            const diaStr = new Date(reg.data).toISOString().split('T')[0];
            checksPorDia[diaStr] = (checksPorDia[diaStr] || 0) + 1;
        }

        let diasPerfeitosContagem = 0;
        if (totalHabitos > 0) {
            for (const dia in checksPorDia) {
                if (checksPorDia[dia] >= totalHabitos) diasPerfeitosContagem++;
            }
        }

        const dadosBrutos = {
            historicoId: insertHistorico.insertedId.toString(), 
            perfilId: perfilId,
            totalChecks: registros.length, 
            totalHabitos: totalHabitos,
            duracao: ciclo.duracao,
            diasPerfeitos: diasPerfeitosContagem, 
            dataInicio: ciclo.data,
            dataFim: ciclo.dataFim
        };

        await estatisticaService.processarESalvar(dadosBrutos);
        await db.collection(this.collectionName).deleteOne({ _id: ciclo._id });

        return true;
    }

    /**
     * Processamento em lote para documentos com dataFim < dataAtual.
     * Itera sobre participantes para geração individual de métricas e histórico.
     */
    async encerrarCiclosVencidos() {
        const db = await conectarBanco();
        const hoje = new Date();

        const ciclosVencidos = await db.collection(this.collectionName).find({ 
            dataFim: { $lt: hoje, $ne: null } 
        }).toArray();

        if (ciclosVencidos.length === 0) return;

        for (const ciclo of ciclosVencidos) {
            const habitosDoCiclo = await db.collection('habitos').find({ cicloId: ciclo._id }).toArray();
            const totalHabitos = habitosDoCiclo.length;
            const habitosIds = habitosDoCiclo.map(h => h._id);

            for (const participanteId of ciclo.participantes) {
                const insertHistorico = await db.collection('historicos').insertOne({
                    cicloId: ciclo._id,
                    perfilId: participanteId,
                    nomeCiclo: ciclo.nome,
                    dataInicio: ciclo.data,
                    dataFim: ciclo.dataFim,
                    participantes: ciclo.participantes
                });

                const registros = await db.collection('registros').find({
                    perfilId: participanteId,
                    habitoId: { $in: habitosIds }
                }).toArray();

                const checksPorDia: { [data: string]: number } = {};
                for (const reg of registros) {
                    const diaStr = new Date(reg.data).toISOString().split('T')[0];
                    checksPorDia[diaStr] = (checksPorDia[diaStr] || 0) + 1;
                }

                let diasPerfeitosContagem = 0;
                if (totalHabitos > 0) {
                    for (const dia in checksPorDia) {
                        if (checksPorDia[dia] >= totalHabitos) diasPerfeitosContagem++;
                    }
                }

                const dadosBrutos = {
                    historicoId: insertHistorico.insertedId.toString(), 
                    perfilId: participanteId.toString(),
                    totalChecks: registros.length, 
                    totalHabitos: totalHabitos,
                    duracao: ciclo.duracao,
                    diasPerfeitos: diasPerfeitosContagem, 
                    dataInicio: ciclo.data,
                    dataFim: ciclo.dataFim
                };

                await estatisticaService.processarESalvar(dadosBrutos);
            }
            await db.collection(this.collectionName).deleteOne({ _id: ciclo._id });
        }
    }
}

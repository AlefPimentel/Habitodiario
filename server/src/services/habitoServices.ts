import { ObjectId } from 'mongodb';
import { conectarBanco } from '../config/database.js';

export class HabitoServices {
    private collectionName = 'habitos';
    private recordsCollection = 'registros';

    /**
     * Persiste a definição atômica de um hábito vinculada a um ciclo.
     */
    async criarDefinicao(nome: string, cicloId: string) {
        const db = await conectarBanco();
        return await db.collection(this.collectionName).insertOne({
            nome,
            cicloId: new ObjectId(cicloId)
        });
    }

    /**
     * Gerencia a idempotência de registros de check-in para a data atual.
     * Filtra a existência de documentos no range [00:00:00 - 23:59:59] do timestamp vigente.
     */
    async alternarRegistro(habitoId: string, perfilId: string) {
        const db = await conectarBanco();
        const col = db.collection(this.recordsCollection);
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const fimHoje = new Date();
        fimHoje.setHours(23, 59, 59, 999);

        const filtro = {
            habitoId: new ObjectId(habitoId),
            perfilId: new ObjectId(perfilId),
            data: { $gte: hoje, $lte: fimHoje }
        };

        const existente = await col.findOne(filtro);

        if (existente) {
            return "ja_marcado"; 
        } else {
            await col.insertOne({
                habitoId: new ObjectId(habitoId),
                perfilId: new ObjectId(perfilId),
                data: new Date()
            });
            return "marcou_agora"; 
        }
    }

    /**
     * Recupera o estado de conclusão de hábitos em um bloco semanal dinâmico.
     * Calcula o range temporal baseado em blocos de 7 dias a partir da gênese do ciclo.
     */
    async listarComStatusSemanal(cicloId: string, perfilId: string, offset: number = 0) {
        const db = await conectarBanco();
        
        const cicloAtual = await db.collection('ciclos').findOne({ _id: new ObjectId(cicloId) });
        if (!cicloAtual) throw new Error("Ciclo não encontrado");

        const dataCriacao = new Date(cicloAtual.data);
        dataCriacao.setHours(0,0,0,0);

        /** * Definição dos limites da janela semanal baseada no offset do cliente 
         */
        const inicioSemana = new Date(dataCriacao);
        inicioSemana.setDate(dataCriacao.getDate() + (offset * 7));

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23,59,59,999);

        const ciclosIrmaos = await db.collection('ciclos').find({ codigoConvite: cicloAtual.codigoConvite }).toArray();
        const ciclosIds = ciclosIrmaos.map(c => c._id);

        const habitos = await db.collection(this.collectionName).find({
            cicloId: { $in: ciclosIds }
        }).toArray();

        const habitosIds = habitos.map(h => h._id);

        const registrosSemana = await db.collection(this.recordsCollection).find({
            perfilId: new ObjectId(perfilId),
            habitoId: { $in: habitosIds },
            data: { $gte: inicioSemana, $lte: fimSemana } 
        }).toArray();

        /** * Mapeamento de matriz booleana para representação de dias da semana (Segunda-Domingo) 
         */
        return habitos.map(h => {
            const statusDias = [];
            for (let i = 0; i < 7; i++) {
                const temRegistro = registrosSemana.some(r => {
                    const d = new Date(r.data);
                    const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
                    return r.habitoId.toString() === h._id.toString() && idx === i;
                });
                statusDias.push(temRegistro);
            }
            return { ...h, statusDias };
        });
    }

    /**
     * Recupera o estado histórico de hábitos para ciclos já arquivados.
     * Utiliza o ID do histórico como âncora para determinar a janela temporal original.
     */
    async listarParaHistorico(historicoId: string, perfilId: string, offset: number = 0) {
        const db = await conectarBanco();
        
        const historico = await db.collection('historicos').findOne({ _id: new ObjectId(historicoId) });
        if (!historico) throw new Error("Histórico não encontrado");

        const dataCriacao = new Date(historico.dataInicio);
        dataCriacao.setHours(0,0,0,0);

        const inicioSemana = new Date(dataCriacao);
        inicioSemana.setDate(dataCriacao.getDate() + (offset * 7));

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23,59,59,999);

        const habitos = await db.collection(this.collectionName).find({
            cicloId: new ObjectId(historico.cicloId)
        }).toArray();

        const habitosIds = habitos.map(h => h._id);

        const registrosSemana = await db.collection(this.recordsCollection).find({
            perfilId: new ObjectId(perfilId),
            habitoId: { $in: habitosIds },
            data: { $gte: inicioSemana, $lte: fimSemana }
        }).toArray();

        /** * Reconstrução da grade semanal baseada em registros de auditoria (Auditor Replay) 
         */
        return habitos.map(h => {
            const statusDias = [];
            for (let i = 0; i < 7; i++) {
                const temRegistro = registrosSemana.some(r => {
                    const d = new Date(r.data);
                    const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
                    return r.habitoId.toString() === h._id.toString() && idx === i;
                });
                statusDias.push(temRegistro);
            }
            return { ...h, statusDias };
        });
    }
}

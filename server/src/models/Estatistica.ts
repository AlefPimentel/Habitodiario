export class Estatistica {
    public historicoId: string;
    public perfilId: string;
    public totalChecks: number;
    public totalHabitos: number;
    public duracaoTotal: number | null;
    public diasPerfeitos: number;
    public dataInicio: Date;
    public dataFim: Date | null;
    public dataEncerrado: Date;
    public diasCumpridos: number;
    public porcentagemConcluida: number;
    public porcentagemChecks: number;
    public nota: number;
    public concluidoComSucesso: boolean;

    /**
     * Entidade de leitura (Read Model) para persistência de métricas calculadas.
     * @param dadosLiquidos Objeto proveniente da camada de serviço após processamento matemático.
     */
    constructor(dadosLiquidos: any) {
        this.historicoId = dadosLiquidos.historicoId;
        this.perfilId = dadosLiquidos.perfilId;
        this.totalChecks = dadosLiquidos.totalChecks;
        this.totalHabitos = dadosLiquidos.totalHabitos;
        this.duracaoTotal = dadosLiquidos.duracaoTotal;
        this.diasPerfeitos = dadosLiquidos.diasPerfeitos;
        this.dataInicio = new Date(dadosLiquidos.dataInicio);
        this.dataFim = dadosLiquidos.dataFim ? new Date(dadosLiquidos.dataFim) : null;
        
        /** * Timestamp de fechamento do registro para auditoria 
         */
        this.dataEncerrado = new Date();
        
        this.diasCumpridos = dadosLiquidos.diasCumpridos;
        this.porcentagemConcluida = dadosLiquidos.porcentagemConcluida;
        this.porcentagemChecks = dadosLiquidos.porcentagemChecks;
        this.nota = dadosLiquidos.nota;
        this.concluidoComSucesso = dadosLiquidos.concluidoComSucesso;
    }
}

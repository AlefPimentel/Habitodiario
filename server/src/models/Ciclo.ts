export class Ciclo {
    public nome: string;
    public data: Date;
    public participantes: string[]; 
    public codigoConvite: string;   
    public duracao: number | null;
    public checkDiario: number;
    public checkSemanal: number;
    public checkMensal: number;

    /**
     * @param nome Identificador nominal do ciclo.
     * @param criadorId FK do perfil proprietário da instância.
     * @param duracao Time-to-live (TTL) do ciclo em dias.
     * @param codigoExistente Permite a herança de código de convite para vinculação em grupos.
     * @param dataExistente Permite retroatividade ou sincronização de data entre membros do grupo.
     */
    constructor(nome: string, criadorId: string, duracao: number | null = 30, codigoExistente?: string, dataExistente?: Date) {
        this.nome = nome;
        this.data = dataExistente ? new Date(dataExistente) : new Date();
        this.participantes = [criadorId]; 
        this.duracao = duracao;
        this.checkDiario = 0;
        this.checkSemanal = 0;
        this.checkMensal = 0;

        /** * Implementação de identificador único de grupo via Base36 para colisão reduzida 
         */
        this.codigoConvite = codigoExistente || Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    /**
     * Formata metadados cronológicos para exibição em camadas de UI.
     * @returns {string} Interpolação de mês nominal e dia civil.
     */
    getResumoCiclo(): string {
        const meses = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        return `${meses[this.data.getMonth()]} - Dia ${this.data.getDate()}`;
    }
}

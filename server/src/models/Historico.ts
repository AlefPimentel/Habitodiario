/**
 * Entidade de persistência para ciclos encerrados.
 * Atua como um snapshot imutável para auditoria e consulta de desempenho passado.
 */
export class Historico {
    public cicloId: string;
    public perfilId: string;
    public nomeCiclo: string;
    public dataInicio: Date;
    public dataFim: Date;
    public participantes: string[];

    /**
     * @param dados Objeto contendo os metadados extraídos da coleção ativa de ciclos no momento do arquivamento.
     */
    constructor(dados: any) {
        /** * Referência ao ID original da coleção 'ciclos' para rastreabilidade 
         */
        this.cicloId = dados.cicloId;
        this.perfilId = dados.perfilId;
        this.nomeCiclo = dados.nomeCiclo;
        this.dataInicio = new Date(dados.dataInicio);
        
        /** * Normalização da data de término: utiliza data programada ou timestamp atual de encerramento 
         */
        this.dataFim = dados.dataFim ? new Date(dados.dataFim) : new Date();
        this.participantes = dados.participantes || [];
    }
}

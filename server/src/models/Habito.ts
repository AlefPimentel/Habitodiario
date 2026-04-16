export class Habito {
    /**
     * @param nome Descrição da tarefa/hábito.
     * @param cicloId FK de vinculação com a entidade Ciclo (Relacionamento 1:N).
     */
    constructor(
        public nome: string,
        public cicloId: string 
    ) {}
}

/**
 * Documento transacional de conclusão de tarefa.
 * Representa um evento único de interação entre o usuário e um hábito em um timestamp específico.
 */
export class Registro {
    public habitoId: string;
    public perfilId: string;
    public data: Date;

    /**
     * @param habitoId FK referente à coleção de hábitos.
     * @param perfilId FK referente ao autor da ação.
     * @param data Timestamp do evento; default para o momento da instanciação (Runtime).
     */
    constructor(habitoId: string, perfilId: string, data: Date = new Date()) {
        this.habitoId = habitoId;
        this.perfilId = perfilId;
        this.data = data;
    }
}

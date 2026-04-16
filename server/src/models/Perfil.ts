export class Perfil {
    public nome: string;
    public email: string;
    public foto: string;
    private _senha: string;

    constructor(nome: string, email: string, senha: string, foto: string = "fotopadrao.jpg") {
        this.nome = nome;
        this.email = email;
        this.foto = foto;
        
        if (senha.length < 4) {
            throw new Error("A senha deve ter no mínimo 4 caracteres.");
        }
        this._senha = senha;
    }

    get senha(): string { return this._senha; }
    
    set senha(novaSenha: string) {
        if (novaSenha.length >= 4) this._senha = novaSenha;
    }
}

import { ObjectId } from 'mongodb';
import { conectarBanco } from '../config/database.js';
import { Perfil } from '../models/Perfil.js';

export class PerfilServices {
    async criarPerfil(nome: string, email: string, senha: string) {
        const perfilValidado = new Perfil(nome, email, senha);
        const db = await conectarBanco();
        const existe = await db.collection('perfis').findOne({ email });
        if (existe) throw new Error("Este email já está cadastrado.");

        return await db.collection('perfis').insertOne({
            nome: perfilValidado.nome,
            email: perfilValidado.email,
            senha: perfilValidado.senha,
            foto: perfilValidado.foto
        });
    }

    // NOVO MÉTODO: Atualiza nome e/ou foto
    async atualizarPerfil(id: string, dados: { nome?: string, foto?: string }) {
        const db = await conectarBanco();
        const resultado = await db.collection('perfis').updateOne(
            { _id: new ObjectId(id) },
            { $set: dados }
        );
        return resultado.modifiedCount > 0;
    }

    async buscarPorEmail(email: string) {
        const db = await conectarBanco();
        return await db.collection('perfis').findOne({ email });
    }

    async buscarPorId(id: string) {
        const db = await conectarBanco();
        return await db.collection('perfis').findOne({ _id: new ObjectId(id) });
    }

    async realizarLogin(email: string, senhaFornecida: string) {
        const perfilNoBanco = await this.buscarPorEmail(email);
        if (!perfilNoBanco) return false;
        return perfilNoBanco.senha === senhaFornecida;
    }
}

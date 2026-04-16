import type { Request, Response } from 'express';
import { PerfilServices } from '../services/perfilServices.js';

const perfilService = new PerfilServices();

export class PerfilController {
    async criar(req: Request, res: Response) {
        try {
            const { nome, email, senha } = req.body;
            const resultado = await perfilService.criarPerfil(nome, email, senha);
            return res.status(201).json({ id: resultado.insertedId });
        } catch (erro: any) { return res.status(400).json({ erro: erro.message }); }
    }

    // NOVO MÉTODO: Processa a atualização
    async atualizar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { nome, foto } = req.body;
            
            const sucesso = await perfilService.atualizarPerfil(id, { nome, foto });
            
            if (sucesso) return res.status(200).json({ mensagem: "Perfil atualizado!" });
            return res.status(400).json({ erro: "Nenhuma alteração realizada." });
        } catch (erro: any) { return res.status(500).json({ erro: erro.message }); }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, senha } = req.body;
            const sucesso = await perfilService.realizarLogin(email, senha);
            if (sucesso) {
                const perfil = await perfilService.buscarPorEmail(email);
                return res.status(200).json({ perfilId: perfil?._id });
            }
            return res.status(401).json({ erro: "Senha ou email incorretos." });
        } catch (erro) { return res.status(500).json({ erro: "Erro interno no servidor." }); }
    }

    async buscarPorId(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const perfil = await perfilService.buscarPorId(id);
            if (!perfil) return res.status(404).json({ erro: "Perfil não encontrado." });
            return res.status(200).json({ nome: perfil.nome, foto: perfil.foto });
        } catch (erro: any) { return res.status(500).json({ erro: erro.message }); }
    }
}

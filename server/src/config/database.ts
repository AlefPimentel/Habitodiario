import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

/** * Inicializa a configuração das variáveis de ambiente a partir do arquivo .env 
 */
dotenv.config();

/** * Define a string de conexão priorizando a variável de ambiente do host, 
 * com fallback para instância local de desenvolvimento. 
 */
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/habit_tracker_local";

const client = new MongoClient(uri);

/** * Singleton para armazenamento da instância de conexão com o banco de dados 
 */
let db: Db;

/**
 * Estabelece a conexão com o cluster MongoDB.
 * Implementa padrão Singleton para reutilizar a instância de conexão ativa.
 * @returns {Promise<Db>} Instância do banco de dados inicializada.
 */
export async function conectarBanco(): Promise<Db> {
    try {
        if (db) return db;

        await client.connect();
        console.log("🔥 Conectado ao MongoDB com sucesso!");
        
        /** * Seleção do database alvo dentro do cluster 
         */
        db = client.db("meu_app"); 
        
        return db;
    } catch (erro) {
        console.error("❌ Erro fatal ao conectar ao banco de dados:", erro);
        /** * Encerra o processo da aplicação em caso de falha crítica na camada de persistência 
         */
        process.exit(1); 
    }
}

/**
 * Recupera a instância ativa do banco de dados.
 * @throws {Error} Caso a conexão não tenha sido estabelecida previamente.
 */
export function getDb(): Db {
    if (!db) {
        throw new Error("Banco de dados não inicializado.");
    }
    return db;
}

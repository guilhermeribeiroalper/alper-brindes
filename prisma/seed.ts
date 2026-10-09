import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { hojeCivil, somarDias } from "../src/lib/datas";
import { criarAdaptador } from "../src/lib/adaptador-banco";

const db = new PrismaClient({ adapter: criarAdaptador(process.env.DATABASE_URL) });

async function upsertUsuario(dados: {
  nome: string;
  email: string;
  senha: string;
  perfil: "ADMIN" | "SOLICITANTE";
  departamento: string;
}) {
  const senhaHash = await bcrypt.hash(dados.senha, 12);
  const email = dados.email.toLowerCase();
  return db.usuario.upsert({
    where: { email },
    // Não sobrescreve senha de usuário já existente.
    update: {},
    create: {
      nome: dados.nome,
      email,
      senhaHash,
      perfil: dados.perfil,
      departamento: dados.departamento,
    },
  });
}

// Roda também na inicialização do servidor (npm start): nunca falha por falta de variável,
// só avisa, para o serviço não ficar reiniciando em loop.
async function main() {
  const emailAdmin = process.env.SEED_ADMIN_EMAIL?.trim();
  const senhaAdmin = process.env.SEED_ADMIN_SENHA?.trim();
  let admin = null;
  if (emailAdmin && senhaAdmin) {
    admin = await upsertUsuario({
      nome: process.env.SEED_ADMIN_NOME?.trim() || "Administrador",
      email: emailAdmin,
      senha: senhaAdmin,
      perfil: "ADMIN",
      departamento: "Compras",
    });
    console.log(`Admin: ${admin.email}`);
  } else {
    console.warn("AVISO: SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA não definidos; admin inicial não foi criado.");
    admin = await db.usuario.findFirst({ where: { perfil: "ADMIN" } });
  }

  const emailSolicitante = process.env.SEED_SOLICITANTE_EMAIL?.trim();
  const senhaSolicitante = process.env.SEED_SOLICITANTE_SENHA?.trim();
  if (emailSolicitante && senhaSolicitante) {
    const s = await upsertUsuario({
      nome: "Solicitante Exemplo",
      email: emailSolicitante,
      senha: senhaSolicitante,
      perfil: "SOLICITANTE",
      departamento: "Marketing",
    });
    console.log(`Solicitante: ${s.email}`);
  }

  if (!admin) {
    console.warn("AVISO: nenhum admin no banco; catálogo de exemplo não foi criado.");
    return;
  }
  if (process.env.SEED_PRODUTOS_EXEMPLO?.trim().toLowerCase() === "false") {
    console.log("SEED_PRODUTOS_EXEMPLO=false: catálogo de exemplo não criado.");
    return;
  }
  if ((await db.produto.count()) > 0) {
    console.log("Catálogo já possui produtos; dados de exemplo não foram recriados.");
    return;
  }

  const hoje = hojeCivil();
  const em90 = somarDias(hoje, 90);
  const vencida = somarDias(hoje, -10);

  const fornA = await db.fornecedor.create({
    data: {
      nome: "Brindes Exemplo Ltda.",
      contatoNome: "Contato A",
      contatoEmail: "contato@brindes-exemplo.invalid",
      contatoTelefone: "(11) 0000-0000",
      observacoes: "Fornecedor fictício para testes.",
    },
  });
  const fornB = await db.fornecedor.create({
    data: {
      nome: "Promo Fictícia S.A.",
      contatoNome: "Contato B",
      contatoEmail: "vendas@promo-ficticia.invalid",
    },
  });

  type Faixa = {
    fornecedorId: string;
    valor: number; // centavos
    qtdMin: number;
    prazo: number;
    validade?: Date;
  };
  const produtos: {
    nome: string;
    descricao: string;
    categoria: string;
    imagemUrl?: string;
    faixas: Faixa[];
  }[] = [
    {
      nome: "Caneca de cerâmica 325 ml",
      descricao: "Caneca branca com impressão do logotipo em uma cor.",
      categoria: "Copos e canecas",
      faixas: [
        { fornecedorId: fornA.id, valor: 1890, qtdMin: 1, prazo: 10 },
        { fornecedorId: fornA.id, valor: 1490, qtdMin: 100, prazo: 12 },
        { fornecedorId: fornB.id, valor: 1690, qtdMin: 50, prazo: 15 },
      ],
    },
    {
      nome: "Caneta metálica",
      descricao: "Caneta esferográfica metálica com gravação a laser.",
      categoria: "Escritório",
      faixas: [
        { fornecedorId: fornA.id, valor: 450, qtdMin: 100, prazo: 7 },
        { fornecedorId: fornB.id, valor: 390, qtdMin: 500, prazo: 10 },
      ],
    },
    {
      nome: "Squeeze térmico 500 ml",
      descricao: "Garrafa em inox com parede dupla e tampa rosqueável.",
      categoria: "Copos e canecas",
      faixas: [
        { fornecedorId: fornB.id, valor: 4290, qtdMin: 20, prazo: 20 },
        // Preço vencido: não deve aparecer nas estimativas.
        { fornecedorId: fornA.id, valor: 3590, qtdMin: 20, prazo: 15, validade: vencida },
      ],
    },
    {
      nome: "Bloco de anotações A5",
      descricao: "Bloco com capa personalizada e 80 folhas pautadas.",
      categoria: "Escritório",
      faixas: [{ fornecedorId: fornA.id, valor: 1250, qtdMin: 50, prazo: 14 }],
    },
    {
      nome: "Mochila para notebook",
      descricao: "Mochila em poliéster com compartimento acolchoado. Sem preço cadastrado: exige cotação formal.",
      categoria: "Bolsas e mochilas",
      faixas: [],
    },
  ];

  for (const p of produtos) {
    const produto = await db.produto.create({
      data: { nome: p.nome, descricao: p.descricao, categoria: p.categoria, imagemUrl: p.imagemUrl },
    });
    for (const f of p.faixas) {
      await db.precoFornecedor.create({
        data: {
          produtoId: produto.id,
          fornecedorId: f.fornecedorId,
          valorUnitarioCentavos: f.valor,
          quantidadeMinima: f.qtdMin,
          prazoEntregaDias: f.prazo,
          validadeEstimativa: f.validade ?? em90,
          historico: {
            create: { valorAnteriorCentavos: null, valorNovoCentavos: f.valor, alteradoPorId: admin.id },
          },
        },
      });
    }
  }
  console.log(`Criados 2 fornecedores e ${produtos.length} produtos de exemplo.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

/**
 * Popula o banco com os dados iniciais do workspace (equivalentes aos mocks
 * originais do wireframe). Rode com: npm run db:seed
 *
 * Idempotente: limpa as tabelas antes de inserir, então pode ser rodado
 * quantas vezes for preciso durante o desenvolvimento.
 */
import { randomUUID } from "crypto";
import { db } from "./client";
import { events, notes, reminders, subtasks, users } from "./schema";
import { hash } from "bcryptjs";

function daysFromToday(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Limpando tabelas...");
  await db.delete(subtasks);
  await db.delete(reminders);
  await db.delete(notes);
  await db.delete(events);
  await db.delete(users);

  const now = new Date().toISOString();

  // Criar usuário demo
  const passwordHash = await hash("demo123456", 12);
  const demoUserId = randomUUID();
  await db.insert(users).values({
    id: demoUserId,
    email: "demo@fluxo.app",
    name: "Luiz Henrique",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });
  console.log("Usuário demo criado: demo@fluxo.app / demo123456");

  console.log("Inserindo lembretes...");
  const r1 = randomUUID();
  const r2 = randomUUID();
  await db.insert(reminders).values([
    {
      id: r1,
      userId: demoUserId,
      title: "Finalizar o relatório do 1° trimestre para as partes interessadas",
      done: false,
      group: "overdue",
      dueDate: daysFromToday(-3),
      priority: "HIGH",
      space: "projetos",
      description:
        "É necessário consolidar as métricas do painel de marketing e do funil de vendas referentes aos últimos três meses. Certifique-se de que o resumo executivo destaque o crescimento de 15% na retenção de usuários.",
      position: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: r2,
      userId: demoUserId,
      title: "Revisar a minuta do contrato",
      done: false,
      group: "overdue",
      dueDate: daysFromToday(-1),
      priority: "MED",
      space: "projetos",
      description: "Revisar as cláusulas de rescisão junto ao time jurídico antes de enviar para o cliente.",
      position: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Chamada com a equipe de design",
      done: false,
      group: "hoje",
      dueDate: daysFromToday(0),
      timeLabel: "2:00 PM",
      priority: "LOW",
      space: "projetos",
      description: "Alinhar os próximos passos do design system com o time de produto.",
      position: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Atualizar o roteiro do projeto",
      done: false,
      group: "hoje",
      dueDate: daysFromToday(0),
      space: "projetos",
      description: "Atualizar o roteiro com as novas prioridades definidas no planejamento trimestral.",
      position: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Enviar relatório de despesas mensal",
      done: false,
      group: "hoje",
      dueDate: daysFromToday(0),
      priority: "MED",
      space: "pessoal",
      position: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Entre em contato com o departamento jurídico a respeito do NDA.",
      done: false,
      group: "hoje",
      dueDate: daysFromToday(0),
      priority: "HIGH",
      space: "projetos",
      position: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Prepare os slides da apresentação",
      done: false,
      group: "hoje",
      dueDate: daysFromToday(0),
      space: "projetos",
      position: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Analisar o protótipo final",
      done: false,
      group: "hoje",
      dueDate: daysFromToday(0),
      space: "projetos",
      position: 7,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Aprovação da minuta da newsletter",
      done: false,
      group: "proximos",
      dueDate: daysFromToday(7),
      space: "pessoal",
      position: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Notas da reunião de alinhamento semanal",
      done: true,
      group: "completed",
      space: "projetos",
      position: 9,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log("Inserindo subtarefas...");
  await db.insert(subtasks).values([
    { id: randomUUID(), reminderId: r1, title: "Exportar dados de análise", done: true, position: 0 },
    { id: randomUUID(), reminderId: r1, title: "Escreva o sumário executivo", done: false, position: 1 },
    { id: randomUUID(), reminderId: r1, title: "Revisão com a Emily", done: false, position: 2 },
    { id: randomUUID(), reminderId: r2, title: "Ler cláusulas de rescisão", done: false, position: 0 },
    { id: randomUUID(), reminderId: r2, title: "Enviar comentários ao jurídico", done: false, position: 1 },
  ]);

  console.log("Inserindo notas...");
  await db.insert(notes).values([
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Projeto Ruby on Rails",
      tags: JSON.stringify(["#internal", "#v2-release"]),
      folder: "projetos",
      coverKind: "image",
      content:
        "Este documento reúne as decisões de arquitetura para a segunda versão do backend em Ruby on Rails, incluindo a estrutura de módulos, convenções de nomenclatura e estratégia de migração.\n\nA API será versionada por meio de namespaces em /api/v2, mantendo compatibilidade com os clientes existentes durante o período de transição.\n\nO time definiu o uso de Sidekiq para processamento assíncrono de jobs de exportação de relatórios, com filas separadas por prioridade.\n\nOs testes de integração cobrem os principais fluxos de autenticação, faturamento e sincronização com o painel administrativo.",
      position: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Roteiro para o 4° trimestre",
      tags: JSON.stringify(["#roadmap"]),
      folder: "projetos",
      content:
        "O roteiro do quarto trimestre prioriza a estabilidade da plataforma e a preparação para o lançamento da v2, citando o [[Projeto Ruby on Rails]] como base técnica.\n\nPrioridades técnicas: migração do backend, testes de carga e revisão de segurança.\n\nPrioridades de produto: novo painel de métricas, onboarding simplificado e suporte a times.",
      position: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Documentação do Usuário",
      tags: JSON.stringify(["#docs"]),
      folder: "projetos",
      content:
        "Este guia cobre o processo de onboarding, criação de espaços de trabalho e organização de notas e lembretes, com base no [[Projeto Ruby on Rails]].\n\nCada seção inclui capturas de tela e um passo a passo detalhado para os fluxos mais comuns.",
      position: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Especificações do Projeto Phoenix",
      tags: JSON.stringify(["#spec"]),
      folder: "projetos",
      coverKind: "image",
      content:
        "O projeto visa redefinir a interface do usuário da nossa principal aplicação web, com foco em velocidade e clareza.\n\nAs metas incluem reduzir o tempo de carregamento em 40% e simplificar a navegação entre os módulos principais.\n\nO lançamento está planejado em fases, começando por um grupo piloto de usuários internos.",
      position: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Lista de compras semanal",
      tags: JSON.stringify(["#pessoal"]),
      folder: "pessoal",
      coverKind: "checklist",
      content: "Leite, ovos, pão, abacates, café em grãos, leite de aveia, massa, molho de tomate, alho, cebolas.\n\nNão esquecer de passar na feira para comprar frutas da estação.",
      position: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: 'Reflexões sobre "Deep Work"',
      tags: JSON.stringify(["#leitura"]),
      folder: "pessoal",
      coverKind: "quote",
      content:
        "As ideias de Cal Newport sobre o trabalho focado em um mundo repleto de distrações são mais relevantes do que nunca.\n\nUm ponto-chave é reservar blocos de tempo protegidos, sem notificações, para o trabalho que realmente exige concentração.",
      position: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Referência de configuração do Tailwind",
      tags: JSON.stringify(["#dev", "#referencia"]),
      folder: "arquivo",
      coverKind: "code",
      content:
        "Cores personalizadas para a paleta da marca Novo e utilitário de espaçamento.\n\nSobrescritas específicas para o layout do painel administrativo, incluindo breakpoints customizados.",
      position: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Brainstorming de estratégia para o 1° trimestre",
      tags: JSON.stringify(["#estrategia"]),
      folder: "arquivo",
      content:
        "Sessão de brainstorming com o time de liderança sobre metas de retenção, crescimento e eficiência operacional.",
      position: 7,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log("Inserindo eventos do calendário...");
  await db.insert(events).values([
    { id: randomUUID(), userId: demoUserId, title: "Almoço em família", date: daysFromToday(-10), variant: "light", createdAt: now },
    { id: randomUUID(), userId: demoUserId, title: "Planejamento da Sprint", date: daysFromToday(-8), variant: "dark", createdAt: now },
    { id: randomUUID(), userId: demoUserId, title: "Sincronização de Projetos", date: daysFromToday(-5), variant: "light", createdAt: now },
    { id: randomUUID(), userId: demoUserId, title: "Revisão de Projeto", date: daysFromToday(-1), variant: "light", createdAt: now },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Entrevista com o usuário",
      date: daysFromToday(0),
      timeLabel: "10h00 – 11h30",
      attendees: 2,
      variant: "dark",
      createdAt: now,
    },
    {
      id: randomUUID(),
      userId: demoUserId,
      title: "Treino na academia",
      date: daysFromToday(0),
      timeLabel: "17h – 18h",
      variant: "light",
      createdAt: now,
    },
    { id: randomUUID(), userId: demoUserId, title: "Apresentação para o cliente", date: daysFromToday(8), variant: "dark", createdAt: now },
    { id: randomUUID(), userId: demoUserId, title: "Alinhamento de Estratégia de Produto", date: daysFromToday(1), timeLabel: "10h00 - 11h30 • Sala de Reunião A", attendees: 2, variant: "dark", createdAt: now },
    { id: randomUUID(), userId: demoUserId, title: "Revisão de design com as partes interessadas", date: daysFromToday(2), timeLabel: "14h – 15h • Zoom", variant: "light", createdAt: now },
    { id: randomUUID(), userId: demoUserId, title: "Planejamento Trimestral", date: daysFromToday(4), variant: "dark", allDay: true, createdAt: now },
  ]);

  console.log("Seed concluído ✅");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
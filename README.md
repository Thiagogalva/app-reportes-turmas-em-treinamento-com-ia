# 📊 TreinaReport AI - Sistema Integrado de Reportes de Treinamento

Sistema web completo e inteligente para instrutores e coordenação pedagógica acompanharem diariamente o status de infraestrutura/sistemas dos alunos, controle de absenteísmo, conteúdo ministrado, avaliação de desempenho individual (com justificativas obrigatórias para alunos abaixo do esperado), dashboard analítico com gráficos em tempo real, exportação para Excel/PDF e **Agente de Inteligência Artificial (Google Gemini 3.8 Flash)** para redação e formatação automática de e-mails executivos.

---

## 🚀 Como Iniciar a Aplicação

Para iniciar o servidor local de desenvolvimento, abra o terminal nesta pasta (`c:\Users\thiago\Downloads\versão sistema de report`) e execute:

```bash
npm run dev
```

Abra seu navegador no endereço: **`http://localhost:3000`**

Para gerar uma versão de produção otimizada:
```bash
npm run build
npm start
```

---

## 🌟 Principais Funcionalidades

### 1. 📊 Dashboard de Acompanhamento (Tela Principal)
- **Filtro Inteligente de Turmas Ativas**: Exibe exclusivamente turmas com status **"Em treinamento"**. Turmas concluídas não poluem o painel ativo.
- **KPIs em Tempo Real**:
  - Taxa média de presença/frequência no período.
  - Índice de saúde e estabilidade dos sistemas dos alunos (% de dias sem falhas).
  - Contador de alunos com baixo desempenho (alertas pedagógicos).
  - Total de dias e aulas registradas.
- **Gráficos Interativos**:
  - Evolução diária de assiduidade e presença (% ao longo dos dias).
  - Gráfico de distribuição de níveis de desempenho (Excelente, Bom, Regular, Abaixo do Esperado).
- **Painel de Atenção Pedagógica**: Destaque automático de alunos com baixo desempenho ou faltas recorrentes com os respectivos motivos detalhados.
- **Exportação Consolidada**: Botão para exportar todos os dados da turma para **Excel (.xlsx)**.

### 2. 📝 Lançamento do Reporte Diário (`/relatorio`)
- **Identificação da Turma e Data**: Seletor automático de turmas ativas.
- **Status dos Sistemas dos Alunos**:
  - Alternador: "SIM (100% Operacional)" ou "NÃO (Com Instabilidade/Falha)".
  - Tags rápidas para identificar áreas afetadas (VPN, CRM, VMs, Senhas/Acessos, Internet, etc.).
  - Campo descritivo técnico obrigatório caso haja registro de falha.
- **Frequência e Absenteísmo (abs)**:
  - Registro ágil por aluno com botões coloridos: `[PRESENTE]`, `[AUSENTE]`, `[ATRASADO]`, `[JUSTIFICADO]`.
  - Campo de motivo de ausência/atraso exibido dinamicamente.
- **Conteúdo Estudado no Dia**:
  - Tópicos ministrados, módulos teóricos e exercícios práticos realizados.
- **Desempenho Individual & Regra de Justificativa Obrigatória**:
  - Classificação por aluno: `[EXCELENTE]`, `[BOM]`, `[REGULAR]`, `[ABAIXO DO ESPERADO]`.
  - **Validação Estrita**: Se marcado como "Abaixo do Esperado", o sistema exige obrigatoriamente o detalhamento do motivo/justificativa e bloqueia o envio caso esteja em branco.
- **Observações Gerais do Instrutor**.

### 3. 🤖 Agente de IA para E-mail Executivo (Gemini 3.8 Flash)
- Acionado com 1 clique pelo botão **"Gerar E-mail com IA"**.
- Gera automaticamente:
  - Assunto formal padronizado.
  - Resumo executivo da aula orientado a gestores e líderes.
  - Análise pedagógica e plano de ação corretivo para alunos em risco.
  - **E-mail em HTML Rico Formatado**: Visual corporativo pronto para copiar e colar diretamente no **Outlook** ou **Gmail** com cores, tabelas e marcadores preservados.
  - **Cópia em 1-clique** via API `ClipboardItem` (HTML + Texto Puro).
  - **Abertura Direta (`mailto:`)** no seu aplicativo de e-mail padrão.
- *Nota: Funciona com chave de API do Gemini (`GEMINI_API_KEY`) ou com o motor inteligente integrado offline caso você ainda não tenha configurado uma chave.*

### 4. 👥 Gestão de Turmas (`/turmas`)
- **Alternância de Status**:
  - **Em treinamento**: Turma ativa, presente no Dashboard e no seletor de reportes.
  - **Concluída**: Automaticamente arquivada fora do Dashboard e novos lançamentos, com histórico integral preservado e possibilidade de reativação a qualquer instante.
- Cadastro e edição de turmas (nome, código, datas, instrutor).
- Gerenciamento de alunos: Adicionar aluno individual ou colar listas de nomes em lote.

### 5. 📂 Histórico Geral & Exportação (`/historico`)
- Busca textual por turma, conteúdo estudado ou nome de aluno.
- Filtros rápidos: "Apenas com baixo desempenho" ou "Apenas com falhas de sistema".
- Visualização detalhada do reporte.
- Exportação para **PDF diagramado** e **Excel (.xlsx com 4 abas estruturadas)**.

### 6. ⚙️ Configurações (`/configuracoes`)
- Inserção segura da Chave de API do Google Gemini.
- Definição de lista padrão de e-mails para envio (coordenação, gerência).
- Nome padrão do instrutor e assinatura corporativa.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: Next.js 15 (React 19, App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **Exportação**: XLSX (SheetJS) & jsPDF / jsPDF-autotable
- **Inteligência Artificial**: Google GenAI SDK (`@google/genai`) com modelo `gemini-3.8-flash`
- **Armazenamento**: Banco local JSON com escrita atômica segura (`data/db.json`)

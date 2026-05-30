# AGENTS.md

## Escopo
Estas instruções valem para todo o repositório SIGE.

## Contexto do projeto
SIGE é uma aplicação full-stack com backend em NestJS/Prisma e frontend em React/Vite. Antes de alterar fluxos de domínio, consulte o `README.md`, `docs/ARQUITETURA.md`, `backend/prisma/schema.prisma`, os módulos em `backend/src` e as páginas em `frontend/src/pages`.

## Tarefa prioritária para o Codex
Analise o projeto SIGE e implemente o fluxo completo de substituições.

### Objetivo
Implementar o fluxo completo de substituições de servidores a partir dos afastamentos.

### Requisitos funcionais
- Corrigir a tela de Afastamentos.
- Exibir um botão `Selecionar` para cada sugestão de substituto.
- Ao clicar em `Selecionar`, gravar a escolha em `Substitution` no backend.
- Criar a tela `/substituicoes` no frontend.
- Na tela de substituições, listar:
  - substituto;
  - servidor original;
  - horário;
  - status.

### Requisitos técnicos
- Garantir que backend e frontend compilam.
- Manter integração coerente entre Prisma, serviços/controllers NestJS e camada de API do frontend.
- Atualizar tipos e contratos de API quando necessário.
- Evitar mudanças não relacionadas ao fluxo de substituições.
- Criar uma PR com as alterações ao finalizar.

## Comandos úteis
Execute os comandos a partir da raiz do repositório, salvo indicação contrária.

### Backend
```bash
cd backend
npm install
npm run build
```

### Frontend
```bash
cd frontend
npm install
npm run build
```

## Como testar este arquivo
Se os comandos `git status` ou `sed -n '1,120p' AGENTS.md` retornarem `fatal: not a git repository` ou `No such file or directory`, você está fora da pasta do projeto. Primeiro entre na raiz do repositório SIGE.

Exemplo em ambiente Codex/local:
```bash
cd /workspace/sige-saas
git status --short --branch
sed -n '1,120p' AGENTS.md
```

Exemplo em VPS, usando os caminhos oficiais do projeto:
```bash
cd /var/www/sige-saas
git status --short --branch
sed -n '1,120p' AGENTS.md
```

Para validar a compilação documentada neste arquivo na VPS, execute:
```bash
cd /var/www/sige-saas/backend
npm install
npm run build

cd /var/www/sige-saas/frontend
npm install
npm run build
```

## Caminhos e GitHub oficiais
- Usuário GitHub: `GutoBertagnolli`.
- Repositório GitHub: `sige-saas`.
- Remote recomendado: `https://github.com/GutoBertagnolli/sige-saas.git`.
- Raiz do projeto na VPS: `/var/www/sige-saas/`.
- Backend na VPS: `/var/www/sige-saas/backend`.
- Frontend na VPS: `/var/www/sige-saas/frontend`.
- Em ambiente Codex/local, a raiz normalmente é `/workspace/sige-saas`; em respostas ao usuário e instruções de VPS, prefira os caminhos `/var/www/sige-saas`, `/var/www/sige-saas/backend` e `/var/www/sige-saas/frontend`.

Para configurar o remote e fazer push da branch atual na VPS:
```bash
cd /var/www/sige-saas
git remote add origin https://github.com/GutoBertagnolli/sige-saas.git 2>/dev/null || git remote set-url origin https://github.com/GutoBertagnolli/sige-saas.git
git push -u origin $(git branch --show-current)
```

## Convenções de trabalho
- Verifique `git status` antes e depois das alterações.
- Prefira mudanças pequenas, coesas e fáceis de revisar.
- Não reverta alterações existentes que não foram feitas por você.
- Quando alterar comportamento visível no frontend, valide a compilação e, se possível, capture evidências visuais.
- A cada mudança ou atualização do sistema, incremente a versão em `VERSION`, `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json` e `frontend/src/version.ts`.

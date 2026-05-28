# SIGE by SUPORTIVA

Sistema SaaS educacional para gestão de escolas, turmas, horários, afastamentos e substituições.

## Stack
- Backend: NestJS + Prisma
- Frontend: React + Vite + TailwindCSS
- Banco: PostgreSQL
- Deploy: Nginx + PM2

## Primeiro acesso seed
- Tenant: suportiva
- Usuário: admin@suportiva.org
- Senha: admin123

Troque a senha imediatamente após subir o ambiente.

## Rodar backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

## Rodar frontend
```bash
cd frontend
npm install
npm run dev
```

## Build produção
```bash
cd backend && npm run build && pm2 start dist/main.js --name sige-backend
cd frontend && npm run build
```

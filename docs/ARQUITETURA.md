# Arquitetura Inicial

## Núcleo do MVP
1. Multi-tenant
2. Usuários e RBAC
3. Escolas
4. Modelos de horários por escola
5. Turmas
6. Grade da turma
7. Servidores
8. Afastamentos
9. Substituições
10. Mensagens e auditoria

## Regra central
A grade da turma vem antes da grade do professor.

Unidade operacional:
Turma + dia da semana + período + disciplina/função + professor.

## Próxima implementação
- CRUD completo de escolas
- CRUD completo de modelos de horários
- Tela visual de grade semanal com checkbox
- Cadastro de turma vinculado ao modelo de horário

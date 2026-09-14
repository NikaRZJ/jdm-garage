# jdm-garage

Сайт-витрина импортёра JDM-автомобилей с админкой и поиском на естественном языке.
Учебный пет-проект: цель — отработать бэкенд на NestJS + PostgreSQL, аутентификацию и роли,
production-контур и одну LLM-фичу в production.

Правила работы над проектом — `CLAUDE.md`, архитектурные решения — `docs/adr/`,
требования и этапы — PRD в папке документов (вне репозитория).

## Окружение

- Node 24 LTS (`.nvmrc`)
- pnpm 12 — `npm i -g pnpm`
- Docker — понадобится с задачи 0.6

## Запуск

```bash
pnpm install
pnpm typecheck
pnpm lint
```

Локальная среда (PostgreSQL 18 + pgvector, Garage) поднимается через `docker compose up` — появится на задаче 0.6.

## Структура

| Путь              | Что                                                        |
| ----------------- | ---------------------------------------------------------- |
| `apps/api`        | API на NestJS — появится на задаче 0.7                     |
| `apps/web`        | SPA на Vite + React — задача 0.10                          |
| `packages/shared` | Общие zod-схемы, типы, константы статусов, сид справочника |
| `packages/config` | Общие настройки TypeScript, ESLint, Prettier               |
| `infra/`          | Docker Compose, nginx, скрипты бэкапа                      |
| `docs/adr/`       | Архитектурные решения                                      |

## Команды

| Команда                             | Что делает                            |
| ----------------------------------- | ------------------------------------- |
| `pnpm lint` / `pnpm lint:fix`       | ESLint по всему репозиторию           |
| `pnpm format` / `pnpm format:check` | Prettier                              |
| `pnpm typecheck`                    | `tsc --noEmit` в каждом пакете        |
| `pnpm test`                         | тесты пакетов (появятся с задачи 0.7) |
| `pnpm build`                        | сборка пакетов                        |

## Стек

TypeScript 6 (strict, ESM), NestJS 12, Drizzle ORM + PostgreSQL 18 + pgvector,
React 19 + Vite + TanStack Router/Query + MUI, Vitest, Testing Library, Playwright, Testcontainers.

TypeScript намеренно зафиксирован на `~6.0.3`: в 7.x нет compiler API, из-за чего не работают
`nest build` и плагин Swagger.

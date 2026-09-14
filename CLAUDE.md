# jdm-garage — CLAUDE.md

Черновик от 14.09.2026 — положить в корень репозитория как `CLAUDE.md` перед первым запуском Claude Code (задача 0.12 закрывает его окончательно: команды и скиллы). Раздел «Команды» уточнять по мере появления скриптов.

---

Учебный пет-проект: сайт-витрина импортёра JDM-автомобилей с админкой (MVP) и поиском на естественном языке (1.0). Цель — навыки, а не выручка. Источник правды по требованиям — PRD v0.3 и контекст проекта в папке документов `~/Claude/Projects/jdm-garage/` (вне репозитория); выжимка правил — ниже. Разработчик — frontend (React/TypeScript), бэкенд, база и инфраструктура для него зона роста: объясняй их через сравнения с фронтенд-практиками, не упрощая до потери точности.

## Стек и версии (проверены 14.09.2026, подробности — `docs/stack-versions-2026-09-14.md` в папке документов)

- Node 24 LTS, pnpm 12 (поле `packageManager` в корневом `package.json`), TypeScript `~6.0.x` — **не 7.x** (у 7.0 нет compiler API: ломаются `nest build` и Swagger-плагин), ESM во всех пакетах.
- `apps/api`: NestJS 12 (Express 5), zod 4 через Standard Schema (`@Body({ schema })`, глобальный `StandardSchemaValidationPipe`), `@nestjs/swagger` 12 + `zod-openapi`, Drizzle ORM 0.45 + drizzle-kit, PostgreSQL 18 + pgvector 0.8, pino (`nestjs-pino`), `jose` + `argon2`, `@aws-sdk/client-s3` → Garage, `sharp`, `@nestjs/schedule`.
- `apps/web`: React 19, Vite 8, TanStack Router (файловые маршруты, `validateSearch` через zod) + TanStack Query v5, MUI 9 с одной светлой темой, Material React Table для админки (совместимость с MUI 9 проверяется на этапе 2; запасной вариант — `@mui/x-data-grid`), react-hook-form + `@hookform/resolvers`; клиент API генерируется orval 8 из OpenAPI — руками не пишется.
- `packages/shared`: zod-схемы (фильтры, DTO, перечисления, статусы), сид справочника. `packages/config`: `tsconfig.base.json`, ESLint flat config, Prettier.
- Тесты: Vitest, Testing Library, MSW; интеграционные тесты API — `@nestjs/testing` + supertest + Testcontainers с реальным PostgreSQL (моки базы запрещены); e2e — Playwright.
- Не добавлять: `nestjs-zod`, Prisma, Passport-стратегии для JWT (auth пишется на `jose` осознанно), Redis/BullMQ (очередь — таблица в PostgreSQL с `FOR UPDATE SKIP LOCKED`), MinIO (заменён на Garage), Tailwind. Новые зависимости — только по явной просьбе.

## Команды

`pnpm install` · `pnpm dev` (api + web) · `pnpm lint` · `pnpm typecheck` · `pnpm test` (unit) · `pnpm test:int` (интеграционные, Testcontainers) · `pnpm e2e` · `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:seed` · `pnpm api:generate` (OpenAPI → клиент) · `docker compose up -d` (PostgreSQL + pgvector, Garage).

## Правила

1. **Правило «руками».** Схему базы и миграции, схему аутентификации, устройство поиска, конфигурацию nginx и CI пишет разработчик сам. По этим темам: объясняй, задавай вопросы, предлагай варианты с последствиями, ревьюй — но не выдавай готовое решение целиком, пока не попросят прямо. Шаблонный код делай полностью: CRUD-эндпоинты, DTO и zod-схемы по описанию, формы, тесты по образцу, сидеры, конфиги линтера, скелеты модулей.
2. **ADR.** Решение с альтернативами → `docs/adr/NNN-slug.md` (контекст, варианты, решение, последствия). Если решение принимается в разговоре без ADR — напомни. Заняты: 001 монорепозиторий, 002 ORM, 003 auth, 004 хранилище объектов, 005 поиск.
3. **Тесты обязательны.** Unit для логики, интеграционные на реальном PostgreSQL для API, e2e-smoke для ключевых сценариев. Задача не готова, пока тесты не зелёные локально и в CI.
4. **Безопасность.** Любой код про auth, файлы, SQL, LLM — сначала чек-лист PRD §8: argon2id; access-токен в памяти, refresh в httpOnly-cookie с ротацией и семьями токенов; CSRF-защита refresh (`Origin`/`Sec-Fetch-Site` + кастомный заголовок); ни `password_hash`, ни `token_hash` в ответах; только параметризованный SQL; тип файла по содержимому, перекодирование изображений; текст пользователя в промпте — только как данные.
5. **Терминология.** Машина = `Listing`, заявка = `Inquiry`, бронь = `Reservation`, справочник = `reference` (`Make`, `Model`, `Engine`), каталог = публичный список. Статусы — как в PRD §6.3: машина `draft / published / reserved / sold / archived`, бронь `active / expired / cancelled / completed`, заявка `new / in_progress / won / lost / spam`; переход вне таблицы — 409.
6. **Объём.** Пункт, который не ломает сценарий MVP и не кормит учебную цель, уходит в следующую версию. Не расширяй задачу без спроса, не добавляй «полезное рядом».
7. **Коммиты и PR.** Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`); одна задача — один PR с коротким «что и почему»; красный CI не сливается.
8. **Язык.** Документация, ADR, комментарии, тексты интерфейса — по-русски; код и идентификаторы — по-английски. Англицизмы в текстах только там, где нет нормального русского термина.

## Структура

`apps/api` · `apps/web` · `packages/shared` · `packages/config` · `infra/` (Compose, nginx, скрипты бэкапа) · `docs/` (`adr/`, `runbook.md`, `notes/` — заметки по этапам, `perf/` — отчёты EXPLAIN, `sketches/`, `eval/` — с 1.0).

## Как ставить задачу агенту

Что сделать + где (пакет, модуль) + ограничения (стек, версии, «зависимостей не добавлять») + критерий готовности (команда, которая должна пройти). Ключевые решения уже в PRD и ADR; если нужного решения там нет — спроси, а не решай сам.

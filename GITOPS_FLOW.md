# GitOps Flow & CI/CD Deployment Strategy

Данный документ описывает процесс CI/CD и деплоя виджета **Shadow Stack**, удовлетворяющий факторам гравитации (Фактор 8 `CI/CD & GitOps`).

## Общий пайплайн разработки

1. **Local Development**:
   - Backend запущен на **Node.js 22 (ESM)** с интеграцией Vercel AI SDK.
   - Секреты хранятся и управляются через Doppler (проверка `1.env.check_dotenv`).
   
2. **Quality Gates (PR/Commit Phase)**:
   - Ветка `main` заблокирована для прямых коммитов без CI (в идеальной картине).
   - Запускается экшен (см. `.github/workflows/ci.yml`), который выполняет `npm install` и проверку сборки виджета через `npm run build`.
   
3. **Continuous Deployment (Release Phase)**:
   - **Vercel / Cloudflare Pages**: Фронтенд (Next.js) разворачивается автоматически по коммиту благодаря встроенной интеграции.
   - **Electron (Нативная обойма)**: Конечная сборка упаковывается с помощью `electron-builder` в бинарники macOS (ARM64/x86) на этапе Release-тегов и загружается в GitHub Releases.

## Роль Оркестратора в CI
`shadow-stack-orchestrator` локально выполняет "сухой прогон" (Task `2.build.next_check`), чтобы гарантировать, что разработчик не закомитит код, ломающий сборку в облаке. 

## Модель ветвления
- `main` - Стабильная, всегда готовая к релизу.
- Файлы окружения синхронизируются через Doppler.
- Разработка ведется в feature-ветках или прямых локальных коммитах во время ранних стадий Bootstrap.

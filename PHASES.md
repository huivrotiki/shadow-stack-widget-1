# Shadow Stack Orchestrator Phases (Cycle 1 / 6)

Данный документ описывает структуру фаз и задач (Phase/Task Map) для `shadow-stack-orchestrator`.
Все задачи сгруппированы с учетом 15 факторов Anti-Gravity.
Этот файл является единым источником правды для определения статуса "Здоровья" проекта.

## Текущий цикл Ralph Loop: 3 из 6 (Implementation & Execution Phase 1)
**Статус:** Скрипты Phase 1 (Environment & Git Hygiene) реализованы и добавлены в `main.cjs`. Фаза 0 и Фаза 1 могут выполняться через UI.

## Архитектура Оркестратора

```mermaid
flowchart TD
    UI[Orchestrator UI\n(Bootstrap / Phases)] --> IPC((Electron IPC))
    IPC -- "orchestrator:runTask" --> Main[Main Process\nTask Runner]
    Main --> Phase0[Phase 0: Mac Bootstrap]
    Main --> Phase1[Phase 1: Environment]
    Main --> Phase2[Phase 2: CI/CD & Build]
    Main --> Phase3[Phase 3: DX & UX]
    Main --> Phase4[Phase 4: Support]
    Main --> Phase5[Phase 5: Docs]
    
    subgraph Event Stream
    Main -- "orchestrator:log" --> UI
    Main -- "orchestrator:progress" --> UI
    end
```

---

## 🚦 План проверок и валидации

### Phase 0: Mac / Host Bootstrap (Factor: 1)

**Статус:** [IN_PROGRESS] Скрипты реализованы.

| Task ID | Тип | Статус / Цель проверки |
|---|---|---|
| `0.foundation.scan` | `auto (health)` | Проверяет ОС, архитектуру (ARM64/x86), наличие базовых бинарников |
| `0.mac.bootstrap.xcode` | `auto` | Установка Command Line Tools (xcode-select) |
| `0.mac.bootstrap.brew` | `auto` | Установка Homebrew, если отсутствует |
| `0.mac.performance.ping` | `auto (health)` | (Factor 12) Базовый чек ресурсов (RAM/CPU) перед стартом |

### Phase 1: Environment & Repositories (Factors: 2, 3, 5)

**Статус:** [IN_PROGRESS] Скрипты реализованы.

| Task ID | Тип | Статус / Цель проверки |
|---|---|---|
| `1.repos.clone` | `auto` | Клон необходимых суб-репозиториев |
| `1.git.hygiene_check` | `auto (health)` | Линтинг веток, проверка `.gitignore` |
| `1.node.install_deps` | `auto` | Установка npm зависимостей |
| `1.env.check_dotenv` | `manual (health)` | Проверка `.env` и секретов DOPPLER |

### Phase 2: Build, CI/CD & GitOps (Factors: 4, 8)

| Task ID | Тип | Статус / Цель проверки |
|---|---|---|
| `2.ci.files_present` | `auto` | Наличие CI workflows (GitHub Actions) |
| `2.build.vite_check` | `auto` | Проверка сборки UI виджета (`npm run build`) |
| `2.gitops.describe_flow` | `manual` | Описание процессов деплоя |

### Phase 3: DX & Orchestrator UX (Factors: 6, 7, 13)
| Task ID | Тип | Статус / Цель проверки |
|---|---|---|
| `3.dx.scripts_review` | `auto/manual` | Ревью `package.json` скриптов |
| `3.ux.phases_layout_review` | `manual (health)` | Оценка понятности Bootstrap/Phases UI |

### Phase 4: Observability, Resilience & Security (Factors: 9, 10, 11)

| Task ID | Тип | Статус / Цель проверки |
|---|---|---|
| `4.logs.format` | `auto` | Валидация структуры `orchestrator:log` событий |
| `4.resilience.retry_policy`| `manual (health)` | Правила retry для Failed задач |
| `4.security.tokens_policy` | `manual` | Политика хранения секретов, проверка отсутствия хардкода |

### Phase 5: Documentation & Lock-In (Factors: 14, 15)

| Task ID | Тип | Статус / Цель проверки |
|---|---|---|
| `5.docs.phases` | `manual (health)` | Ревизия файла `PHASES.md` |
| `5.docs.agents` | `manual` | Ревизия `AGENTS.md` |
| `5.docs.runbook` | `manual` | Создание `RUNBOOK.md` для запуска с нуля |
| `5.extensibility.check` | `manual` | Проверка легкости добавления новых задач в UI |

---

## 🛠 Заметки (Цикл 3)

- **Reality**: Добавлены IPC-хэндлеры и bash-скрипты для проверки чистоты Git, установки зависимостей Node (Factor 3) и проверки секретов через Doppler (Factor 5).
- **Alignment**: Фаза 1 (Environment) покрыта Health-чеками (`hygiene_check`, `check_dotenv`). Система оркестратора постепенно закрывает факторов гравитации 1-5.

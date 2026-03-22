# Shadow Stack Orchestrator Phases

Данный документ описывает структуру фаз и задач (Phase/Task Map) для `shadow-stack-orchestrator`.
Все задачи сгруппированы в 6 полных циклов (Ralph Loop) по 15 факторам Anti-Gravity.
Этот файл является единым источником правды для определения статуса "Здоровья" проекта и процесса валидации каждой из фаз.

## Архитектура Оркестратора

```mermaid
flowchart TD
    UI[Orchestrator UI\n(Bootstrap / Phases)] --> IPC((Electron IPC))
    IPC -- "orchestrator:runTask" --> Main[Main Process\nTask Runner]
    Main --> Phase0[Phase 0: Mac Bootstrap]
    Main --> Phase1[Phase 1: Environment]
    Main --> Phase2[Phase 2: CI/CD & Build]
    Main --> Phase3[Phase 3: DX & UX]
    
    subgraph Event Stream
    Main -- "orchestrator:log" --> UI
    Main -- "orchestrator:progress" --> UI
    end
```

---

## 🚦 План проверок и валидации (Validation & Verification Plan)

Главная цель — гарантировать работоспособность инфраструктуры перед написанием бизнес-логики.
В каждом цикле `orchestrator` будет запускать `auto` и просить подтвердить `manual` шаги.

Ниже представлена текущая разбивка:

### Phase 0: Mac / Host Bootstrap
| Task ID | Тип | Статус (Цель проверки) |
|---|---|---|
| `0.foundation.scan` | `auto (health)` | Проверяет ОС, архитектуру (ARM64/x86), базовые бинарники |
| `0.mac.bootstrap.xcode` | `auto` | Установка Command Line Tools (xcode-select) |
| `0.mac.bootstrap.brew` | `auto` | Установка Homebrew, если отсутствует |

**Метод валидации:** Скрипт `check_mac.sh` должен возвращать `exit code 0` при наличии xcode и brew.

### Phase 1: Environment & Repositories
| Task ID | Тип | Статус (Цель проверки) |
|---|---|---|
| `1.repos.clone` | `auto` | Клон необходимых суб-репозиториев (если архитектура многомодульная) |
| `1.git.hygiene_check` | `auto (health)`| Линтинг веток, проверка `.gitignore` на мусор |
| `1.node.install_deps` | `auto` | `npm install` (проверка `package.json` и `package-lock.json`) |
| `1.env.check_dotenv` | `manual` | Наличие переменных в `.env` (секреты не коммитятся) |
| `1.mcp.ping_servers` | `auto (health)`| Проверка доступности портов локальных MCP-серверов |
| `1.skills.audit_md` | `auto` | Проверка `.agent/skills/` и валидности Markdown файлов |

**Метод валидации:** Запуск `npm ls` прошел успешно, `.env` корректен, `grep` не нашел хардкод токенов.

### Phase 2: Build, CI/CD & GitOps
| Task ID | Тип | Статус (Цель проверки) |
|---|---|---|
| `2.ci.files_present` | `auto` | Наличие `.github/workflows/` или аналогов |
| `2.build.vite_check` | `auto` | Вызов `vite build` — проверка сборки UI виджета |
| `2.build.electron_check` | `auto` | Вызов `tsc` / сборщика для Electron main process |
| `2.build.dry_run` | `manual (health)`| Валидация общей сборки приложения |
| `2.gitops.describe_flow`| `manual` | Описание процессов деплоя |

**Метод валидации:** CI файлы валидны, `npm run build` не падает с ошибками.

### Phase 3: DX & Orchestrator UX
| Task ID | Тип | Статус (Цель проверки) |
|---|---|---|
| `3.dx.mcp_startup` | `auto` | Оркестратор сам умеет поднимать дочерние процессы MCP |
| `3.dx.skills_sync` | `auto (health)`| Синхронизация папки `.agents/skills` с контекстом |
| `3.ux.phases_layout_review` | `manual` | Ревью интерфейса Bootstrap/Phases на понятность |

**Метод валидации:** Доступен быстрый запуск приложения по "Run Bootstrap", UI отражает шаги.

---

## 🛠 Следующие шаги для разработчика (Next Steps Planner)

1. **Реализация IPC Handlers**: В файле `main.ts` (или `orchestrator.ts`) добавить `switch(taskId)` для всех вышеуказанных ID.
2. **Bash/Node скрипты (Workers)**: Создать папку `scripts/` и вынести туда тяжелую логику (`xcode-select --install`, проверки портов MCP и т.д.).
3. **Обновление UI**: Изменить hardcoded список Фаз в React/Vue интерфейсе на чтение этого файла (или соответствующего JSON) чтобы UI гарантировано совпадал с данным планом.

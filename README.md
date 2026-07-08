# prelegal

Prelegal - проект на ранней стадии разработки для подготовки юридических материалов и
рабочих процессов перед передачей их юристу или юридической команде.

> Проект находится в активной разработке. Планируемый срок завершения первого этапа -
> 15 июля 2026 г.

## Текущий статус

Репозиторий содержит набор markdown-шаблонов юридических документов, собранных из
публичных репозиториев Common Paper. Эти шаблоны предназначены для последующей
модификации системой под пользовательские данные.

- [x] Набор шаблонов юридических документов
- [x] Базовая документация
- [x] Прототип Next.js приложения для Mutual NDA
- [ ] Тесты
- [ ] CI/CD

## Dataset шаблонов

Шаблоны находятся в директории `templates/`. Корневой файл `catalog.json`
содержит название, описание и имя файла для каждого скачанного markdown-документа.

```text
templates/
├── AI-Addendum.md
├── BAA.md
├── CSA.md
├── DPA.md
├── LICENSE.txt
├── Mutual-NDA-coverpage.md
├── Mutual-NDA.md
├── Partnership-Agreement.md
├── Pilot-Agreement.md
├── Software-License-Agreement.md
├── design-partner-agreement.md
├── psa.md
└── sla.md
```

В набор включены:

- Mutual Non-Disclosure Agreement;
- Cloud Service Agreement;
- Service Level Agreement;
- Data Processing Agreement;
- Design Partner Agreement;
- Professional Services Agreement;
- Partnership Agreement;
- Business Associate Agreement;
- Software License Agreement;
- Pilot Agreement;
- AI Addendum.

Файл `templates/LICENSE.txt` содержит атрибуцию Common Paper и указание на
лицензию CC BY 4.0 для шаблонов в этой директории.

## Быстрый старт

Dataset можно использовать напрямую как markdown-файлы.

Пример чтения catalog:

```bash
node -e "console.log(require('./catalog.json').length)"
```

Прототип Mutual NDA creator находится в `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Для проверки frontend:

```bash
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=moderate
```

## Структура репозитория

```text
.
├── catalog.json
├── frontend/
├── LICENSE
├── README.md
└── templates/
```

## Участие в разработке

1. Создайте отдельную ветку от `main`.
2. Внесите изменения небольшими логическими коммитами.
3. Проверьте форматирование, тесты и документацию, если они применимы.
4. Откройте pull request с кратким описанием изменений.

## Лицензия

Проект распространяется под лицензией MIT. Подробности см. в файле [LICENSE](LICENSE).

# 🌙 LunarEC — Polyglot Open-Source CRM & ERP Suite

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge" alt="Status" />
  <a href="https://github.com/BekbolatBolebay/LunarEC/actions">
    <img src="https://img.shields.io/badge/CI%2FCD-4%20Pipelines%20Passing-brightgreen?style=for-the-badge&logo=github-actions" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-Next.js%2014-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Rust-Stock%20Engine-DEA584?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/Go-POS%20Gateway-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/Python-AI%20Analytics-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Architecture-Odoo%2017%2F18-714B67?style=for-the-badge" alt="Odoo" />
</p>

---

## 📖 Жоба Туралы (About LunarEC)

**LunarEC** — бұл **4 түрлі бағдарламалау тілінің (TypeScript, Rust, Go, Python)** ең мықты тұстарын біріктірген, Odoo 17/18 үлгісіндегі заманауи **Polyglot Monorepo** кәсіпорындық CRM & ERP платформасы.

---

## 🧩 4 Тілдік Модульдер Архитектурасы (Polyglot Matrix)

| Қабат / Модуль | Қолданылған Тіл | Мақсаты және Атқаратын Қызметі |
|---|---|---|
| 🌐 **Frontend & Odoo Shell** | **TypeScript (Next.js 14 + Tailwind)** | Odoo 17 стиліндегі Kanban тақтасы, App Switcher, Chatter және интерактивті UI. |
| 🦀 **`crates/stock-engine`** | **Rust (Edition 2021)** | Қоймадағы 10 000+ ингредиенттің өзіндік құнын (BOM/COGS) микросекундта есептейтін ультра-жылдам ядро. |
| 🐹 **`services/pos-gateway`** | **Go (Golang 1.22+)** | Үстелдер мен кассалық оқиғаларды миллисекундта синхрондайтын жеңіл желілік шлюз. |
| 🐍 **`services/ai-analytics`** | **Python 3.12+** | Мәзір сатылымын болжау (Demand Forecasting) және Odoo JSON-RPC байланысы. |

---

## 🏗️ Архитектуралық Диаграмма

```mermaid
graph TD
    Client[🌐 LunarEC Next.js UI]
    
    subgraph Services [⚡ Polyglot Сервистер]
        RustCore[🦀 Rust: Food Costing & Stock Engine]
        GoPOS[🐹 Go: Real-Time Table & POS Gateway]
        PyAI[🐍 Python: AI Demand Forecasting]
    end

    subgraph Data [🗄️ Дерекқор және Odoo]
        Supabase[(PostgreSQL / Supabase)]
        OdooERP[(Odoo ERP JSON-RPC 2.0)]
    end

    Client --> RustCore
    Client --> GoPOS
    Client --> PyAI
    RustCore --> Supabase
    PyAI --> OdooERP
```

---

## 🚀 Бір Командамен Барлық 4 Тілді Тексеру (Polyglot Test)

Барлық 4 тілдің (TypeScript, Rust, Python, Go) кодтарын жинап, unit-тестілерін бірден өткізу үшін:

```bash
npm run test:polyglot
```

**Нәтижесінде:**
* 🌐 `Next.js 14` ➔ Compiled successfully
* 🦀 `Rust cargo test` ➔ 2 passed, 0 failed (0.00s)
* 🐍 `Python unittest` ➔ 3 passed (0.000s)
* 🐹 `Go test` ➔ PASS (0.002s)

---

## 📂 Жоба Каталогы

```
LunarEC/
├── .github/workflows/ci.yml       ← 4 тілді қатар тексеретін GitHub Actions
├── app/                           ← TypeScript / Next.js веб қолданбасы
├── components/odoo/               ← Odoo стильдегі UI компоненттері
├── crates/
│   └── stock-engine/              ← 🦀 RUST: Қойма мен калькуляция ядросы
│       ├── Cargo.toml
│       └── src/main.rs
├── services/
│   ├── pos-gateway/               ← 🐹 GO: Желілік POS шлюзі
│   │   ├── go.mod
│   │   ├── main.go
│   │   └── main_test.go
│   └── ai-analytics/              ← 🐍 PYTHON: AI сұранысты болжау
│       ├── analytics.py
│       └── test_analytics.py
├── CRM/                           ← SQL схемалар және CRM API
├── ERP/                           ← Рецептура және Odoo интеграциясы
├── package.json
└── LICENSE                        ← MIT License
```

---

## 📄 Лицензия

MIT License © 2026 LunarNT Team.
Барлық әзірлеушілер мен қауымдастық мүшелері өз үлесін қоса алады! 🚀

### 🚀 Architecture Overview
LunarEC uses an event-driven polyglot architecture:
- Next.js Web Dashboard
- Rust In-Memory FIFO/LIFO Engine
- Go POS WebSocket Stream
- Python Predictive Analytics

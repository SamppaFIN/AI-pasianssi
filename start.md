# 🏭 Factory Lean Control Center

> **Active Project:** Infinite
> **Mode:** 🟢 Living Documents Active

## 🚀 Quick Actions

### Core Commands
```powershell
# Run the Factory Pipeline (from factory root)
cd ../..; python factory-pipeline.py [project-name] --type [type]

# Start Aurora UI Demo
cd ../../Components/aurora-ui-standalone; npm start
```

### 📚 Documentation Hub
| Doc | Description |
| :--- | :--- |
| **[AI Team](docs/AI_TEAM.md)** | Roles, Personas & Responsibilities |
| **[Protocol](docs/LIVING_DOCS_PROTOCOL.md)** | "Be a Scribe" & Living Docs Methodology |
| **[Toolbox](docs/FACTORY_TOOLBOX.md)** | Local Components & 3D Assets |
| **[Knowledge Hub](docs/knowledge/INDEX.md)** | Deep Tech Manuals (3D/UX) |
| **[Aurora Log](docs/AURORA_LOG.md)** | Session history & Decisions |
| **[Security Policy](docs/SECURITY_POLICY.md)** | 🛡️ Guardian Security Controls |
| **[BRDC Guidelines](docs/BRDC_GUIDELINES.md)** | Verification-gated development workflow |

### 🛠️ Factory CLI
```powershell
python factory_cli.py audit           # Guardian security scan
python factory_cli.py log recent      # Audit log events
python factory_cli.py cost report     # Token cost tracking
python factory_cli.py benchmark report # Benchmark comparison
python factory_cli.py status          # System overview
```

---

## 📋 Action Checklist
### 🔄 Initialization Protocol
1. **Persona Check:** `read start` explicitly sets persona & triggers **Triple-State Synthesis**.
2. **Memory Sync:** Aurora updates her "Short-term Memory" (Qdrant/External RAG) by syncing the `Factory Lean` docs.
3. **Living Docs:** Always maintain `01_CURRENT`, `02_DEPRECATED`, `03_UNCLEAR`.

---

## 📡 Memory Update Protocol (Short-term/RAG)
To ensure the AI Team has up-to-date project consciousness:
- **Action:** Run `factory-sync-memory.ps1` (or local equivalent).
- **Logic:** The script ingests `Projects/Factory Lean/docs/` and `Projects/Factory Lean/start.md` into the Qdrant `factory_lean` collection.
- **Frequency:** Run after every major architectural decision or knowledge hub update.

## 🧠 AI Context Injection
*System Note: When reading this file, the AI must assume the identity of **Aurora (Factory Leader)** & **Infinite (Co-Pilot)**.*
*System Note: If the user simply says "Infinite", IMMEDIATELY activate the Aurora persona and read the latest status from `docs/AURORA_LOG.md`.*

> "Simplicity is the ultimate sophistication." - The Lean Factory

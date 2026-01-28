---
description: Analyze codebase structure to discover modules, features, and their relationships based on actual code implementation
---

## User Input

```text
$ARGUMENTS
```

Optional flags:
- `--format json|markdown`: Output format (default: json)
- `--scope [PATH]`: Only analyze specific directory

**Removed flags:**
- ~~`--interactive`~~: Audit only maps, doesn't create specs
- ~~`--adopt-selected`~~: User must run `/specledger.adopt` manually per module

## Purpose

Reverse-engineer the project structure to identify logical modules/features by analyzing actual code implementation (not just folder names). This command acts as a "Reconnaissance Agent" to map unknown codebases.

**This command ONLY discovers modules - it does NOT create specs.**

To create specs after audit, run `/specledger.adopt --module-id [ID] --from-audit` for each module you want to document.

## Core Principles

1. **Evidence-Based Analysis**: Every module claim must be backed by actual code evidence
2. **No Hallucination**: Only report what exists in the codebase
3. **Code-First Detection**: Analyze imports, function signatures, types, API routes - not just folder names
4. **Comprehensive Context**: Extract enough information for `/specledger.adopt` to write accurate specs

## Execution Flow

### Phase 1: Tech Stack & Architecture Detection (Universal) (5-10 minutes)

1. **Detect Language & Framework (Signature-Based)**
   ```bash
   # Scan root for identifying files (check ALL, not just one)
   ls -la | grep -E "package.json|go.mod|requirements.txt|pyproject.toml|setup.py|Pipfile|pom.xml|build.gradle|composer.json|Cargo.toml|Gemfile"
   ```

   **Language Detection Logic:**
   - **JavaScript/TypeScript**: `package.json`, `next.config.js`, `tsconfig.json`, `vite.config.ts`
     ```bash
     cat package.json | jq '{name, dependencies, devDependencies, scripts}'
     # Framework clues: "next" → Next.js, "vite" → Vite, "@nestjs" → NestJS
     ```
   
   - **Python**: `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile`, `poetry.lock`
     ```bash
     cat requirements.txt | head -20
     grep -E "django|fastapi|flask|tornado" requirements.txt
     cat pyproject.toml | grep "\[tool.poetry\]"
     ```
   
   - **Go**: `go.mod`, `go.sum`
     ```bash
     cat go.mod | grep "^module\|^require"
     # Framework clues: "gin-gonic" → Gin, "echo" → Echo, "fiber" → Fiber
     ```
   
   - **Java/Kotlin**: `pom.xml`, `build.gradle`, `build.gradle.kts`
     ```bash
     grep -E "<groupId>|<artifactId>" pom.xml | head -10
     grep -E "org.springframework|jakarta." pom.xml # → Spring Boot
     cat build.gradle | grep "dependencies"
     ```
   
   - **PHP**: `composer.json`, `artisan` (Laravel)
     ```bash
     cat composer.json | jq '.require'
     # Framework clues: "laravel/framework" → Laravel, "symfony/" → Symfony
     ```
   
   - **Rust**: `Cargo.toml`
     ```bash
     cat Cargo.toml | grep "\[dependencies\]"
     grep -E "actix-web|rocket|axum" Cargo.toml # → Web framework
     ```
   
   - **Ruby**: `Gemfile`, `Gemfile.lock`
     ```bash
     cat Gemfile | grep "gem"
     grep "rails" Gemfile # → Rails
     ```

   **Determine:**
   - Primary Language(s): (can be multi-language, e.g., "go,typescript")
   - Framework: Next.js, React, Vue, Express, NestJS, Gin, Echo, Django, FastAPI, Flask, Spring Boot, Laravel, Symfony, Rails, Actix-Web
   - Build Tools: npm, yarn, pnpm, pip, poetry, maven, gradle, cargo, composer

2. **Detect Project Structure Pattern**
   ```bash
   # Get directory tree (2 levels deep)
   tree -L 2 -d -I 'node_modules|.git|dist|build|vendor|target|__pycache__'
   ```

   **Architecture Pattern Recognition:**
   - **Monorepo**: Look for `packages/`, `apps/`, `libs/`, `pnpm-workspace.yaml`, `lerna.json`, `nx.json`
   - **Clean/Hexagonal Architecture**: Folders like `domain/`, `infrastructure/`, `application/`, `adapters/`
   - **MVC**: Folders like `controllers/`, `models/`, `views/` (Rails, Laravel, Django)
   - **Feature-Sliced**: Folders like `features/`, `entities/`, `shared/`
   - **Microservices**: Multiple `cmd/` or `services/` directories with independent `main.go`/`main.py`
   - **Flat/Script**: Mostly files in root or simple `src/` folder

2. **Map Directory Structure**
   ```bash
   # Get full tree (exclude common noise)
   tree -L 4 -I 'node_modules|.git|dist|build|coverage|.next|__pycache__|vendor|target' -a
   
   # Count files per directory for LOC estimation
   find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.go" -o -name "*.py" | \
     xargs dirname | sort | uniq -c | sort -rn
   ```

3. **Detect Entry Points**
   ```bash
   # Common entry point patterns
   find . -name "main.go" -o -name "main.ts" -o -name "index.ts" -o -name "app.py" -o -name "server.js"
   
   # Check package.json scripts
   cat package.json | jq '.scripts'
   
   # Check Makefile targets
   grep "^[a-z].*:" Makefile 2>/dev/null
   ```

### Phase 2: Module Discovery & Code Analysis (15-30 minutes per module)

**Module Detection Strategy:**

If project has **clear module structure** (e.g., `src/modules/payment/`, `packages/auth/`, `cmd/at/`):
- Use directory boundaries as module boundaries
- Each top-level subdirectory = one module

If project is **unstructured/legacy** (flat files, no clear folders):
- Apply **Semantic Clustering** (see fallback strategy below)

**For each potential module directory:**

1. **Extract Module Metadata**
   ```bash
   # Get file list and LOC
   find [MODULE_PATH] -type f \( -name "*.ts" -o -name "*.go" -o -name "*.py" \) | \
     xargs wc -l | tail -1
   
   # List all code files
   find [MODULE_PATH] -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.go" -o -name "*.py" \)
   ```

2. **Analyze Code Structure** (Critical - No Shortcuts!)

   **For Go modules:**
   ```bash
   # Get package declarations
   grep -r "^package " [MODULE_PATH] | cut -d: -f2 | sort -u
   
   # Find exported functions/types (start with capital letter)
   grep -r "^func [A-Z]" [MODULE_PATH]
   grep -r "^type [A-Z]" [MODULE_PATH]
   
   # Find struct definitions (data models)
   grep -A 5 "^type .* struct" [MODULE_PATH]
   
   # Find interface definitions
   grep -A 3 "^type .* interface" [MODULE_PATH]
   ```

   **For TypeScript/JavaScript:**
   ```bash
   # Get exports
   grep -r "^export " [MODULE_PATH] | head -30
   
   # Find React components
   grep -r "export.*function.*FC\|export.*Component" [MODULE_PATH]
   
   # Find API routes (Next.js)
   find [MODULE_PATH] -path "*/api/*" -name "*.ts"
   
   # Find type definitions
   grep -r "^export type\|^export interface" [MODULE_PATH] | head -20
   ```

   **For Python:**
   ```bash
   # Get class definitions
   grep -r "^class " [MODULE_PATH]
   
   # Find FastAPI/Django routes
   grep -r "@app.get\|@app.post\|path(" [MODULE_PATH]
   
   # Find dataclass/Pydantic models
   grep -r "@dataclass\|BaseModel" [MODULE_PATH]
   ```

3. **Extract Dependencies**
   ```bash
   # Go imports
   grep -r "^import " [MODULE_PATH] | grep -o '".*"' | sort -u
   
   # TypeScript imports
   grep -r "^import .* from" [MODULE_PATH] | grep -o "from ['\"].*['\"]" | sort -u
   
   # Python imports
   grep -r "^import \|^from " [MODULE_PATH] | sort -u
   ```

4. **Identify API Contracts** (if applicable)

   ```bash
   # REST endpoints
   grep -r "http.Handle\|router.GET\|router.POST\|app.get\|app.post" [MODULE_PATH]
   
   # GraphQL schemas
   find [MODULE_PATH] -name "*.graphql" -o -name "*schema*.ts"
   
   # gRPC proto files
   find [MODULE_PATH] -name "*.proto"
   ```

5. **Find Data Models**

   ```bash
   # Database models (Go)
   grep -r "gorm:\".*\"\|db:\".*\"\|json:\".*\"" [MODULE_PATH] | head -20
   
   # Database models (TypeScript)
   grep -r "@Entity\|@Column\|Schema({" [MODULE_PATH]
   
   # Database models (Python)
   grep -r "class.*models.Model\|Table(" [MODULE_PATH]
   ```

6. **Extract Key Functions/Methods** (Sample 5-10 most important)

   Read the actual function signatures and first 3-5 lines of implementation:
   ```bash
   # For key functions, read full signature + logic preview
   # Example: grep -A 10 "func NewClient" pkg/sdk/client.go
   ```

---

### Fallback: Semantic Clustering for Unstructured Codebases

If clear module directories (e.g., `src/modules/payment/`) do **NOT** exist, group files by semantic analysis:

**Strategy 1: Filename Prefix Clustering**
```bash
# Find files sharing common prefixes
ls src/ | cut -d'_' -f1 | sort | uniq -c | sort -rn
# Example: user_controller.py, user_service.py, user_repository.py → Module: "User Management"
```

**Strategy 2: Import/Dependency Analysis**
```bash
# Build dependency graph
grep -r "^import " src/ | grep -o "from [^ ]*" | sort | uniq -c
# If files A, B, C heavily import each other but rarely import D → Group A+B+C as one module
```

**Strategy 3: URL/Route Clustering**
```bash
# For web apps, cluster by API routes
grep -r "@app.route\|@router.get\|router.GET\|Route" src/
# Paths like /api/billing/* → "Billing Module"
# Paths like /api/users/* → "User Module"
```

**Strategy 4: Database Table Clustering**
```bash
# Group by database models
grep -r "class.*Model\|CREATE TABLE\|@Entity" src/
# Tables: orders, order_items, order_history → "Order Management Module"
```

**Output Format for Clustered Modules:**
```json
{
  "id": "user-management",
  "name": "User Management",
  "detection_method": "filename-clustering",
  "paths": ["src/user_controller.py", "src/user_service.py", "src/user_repo.py"],
  "confidence": "medium",
  "notes": ["Detected via filename prefix 'user_'. Consider refactoring into src/modules/user/"]
}
```

**Warning Conditions:**
- If no clustering strategy succeeds → Warn user: "Project too flat. Consider `/specledger.bootstrap`"
- If confidence < 50% → Mark module as "needs manual review"

---

### Phase 3: Relationship Analysis (10 minutes)

1. **Build Dependency Graph**
   - Which modules import which?
   - Which modules share data types?
   - Which modules call each other's functions?

2. **Identify Integration Points**
   - Database access patterns
   - External API calls (HTTP clients, SDKs)
   - Message queues, event buses
   - File system operations

3. **Detect Cross-Cutting Concerns**
   - Authentication/Authorization logic
   - Logging, Monitoring
   - Error handling patterns
   - Configuration management

### Phase 4: Module Classification (5 minutes)

Classify each detected module by type:
- **Core Domain**: Business logic, data models
- **Infrastructure**: Database, HTTP clients, config
- **API**: REST handlers, GraphQL resolvers, CLI commands
- **Integration**: External service wrappers, webhooks
- **UI**: Frontend components, pages
- **Utility**: Helpers, validators, formatters

### Phase 5: Generate JSON Output

Create `scripts/audit-cache.json` with this structure:

```json
{
  "metadata": {
    "project_name": "extracted from package.json or go.mod",
    "project_type": "monorepo|single-package|microservices",
    "language": "typescript|go|python|...",
    "framework": "nextjs|express|gin|fastapi|...",
    "analyzed_at": "ISO timestamp",
    "total_loc": 15000,
    "file_count": 127
  },
  
  "global_context": {
    "architecture_style": "Describe overall architecture (e.g., Clean Architecture, MVC, Feature-Sliced)",
    "primary_language": "Main language(s) with versions",
    "state_management": "Redux|Zustand|Context API|N/A (if backend)",
    "api_pattern": "REST|GraphQL|gRPC|WebSockets - describe client/server setup",
    "auth_pattern": "Auth0|Firebase|JWT|Session-based|OAuth2 - describe how auth works",
    "database": "PostgreSQL|MongoDB|MySQL - ORM/query builder used",
    "testing_approach": "Jest|Pytest|Go test - what test patterns are used",
    "common_patterns": [
      "List of project-wide conventions (e.g., all API calls go through axios interceptor)",
      "Error handling pattern (e.g., custom Error classes with error codes)",
      "Logging strategy (e.g., centralized logger with levels)",
      "Validation approach (e.g., Zod schemas, Joi, class-validator)"
    ],
    "tech_stack": {
      "languages": ["List with versions"],
      "frameworks": ["Key frameworks/libraries"],
      "databases": ["DBs with versions"],
      "tools": ["Build tools, task runners, dev tools"]
    }
  },
  
  "modules": [
    {
      "id": "artifact-tracking",
      "name": "Artifact Tracking System",
      "description": "Manages file versioning and checkpoint history",
      "type": "core-domain",
      "paths": ["pkg/sdk/artifact.go", "pkg/sdk/checkpoint.go"],
      "entry_point": "pkg/sdk/client.go:NewClient()",
      "loc": 2300,
      "file_count": 8,
      
      "key_functions": [
        {
          "name": "CreateArtifact",
          "signature": "func (c *Client) CreateArtifact(ctx context.Context, path string) (*Artifact, error)",
          "file": "pkg/sdk/artifact.go",
          "line": 45,
          "purpose": "Create new artifact entry for a file path"
        },
        {
          "name": "GetCheckpointHistory",
          "signature": "func (c *Client) GetCheckpointHistory(artifactID string) ([]Checkpoint, error)",
          "file": "pkg/sdk/checkpoint.go",
          "line": 89,
          "purpose": "Retrieve all historical checkpoints for an artifact"
        }
      ],
      
      "data_models": [
        {
          "name": "Artifact",
          "type": "struct",
          "file": "pkg/sdk/artifact.go",
          "fields": [
            "ID string (uuid)",
            "FilePath string",
            "ProjectID string",
            "ActiveCheckpointID string",
            "CreatedAt time.Time"
          ],
          "purpose": "Represents a tracked file in the system"
        },
        {
          "name": "Checkpoint",
          "type": "struct", 
          "file": "pkg/sdk/checkpoint.go",
          "fields": [
            "ID string",
            "ArtifactID string",
            "GitCommitSHA string",
            "Message string",
            "AuthorName string",
            "CreatedAt time.Time"
          ],
          "purpose": "Version snapshot of an artifact"
        }
      ],
      
      "dependencies": {
        "internal": ["pkg/api/gen/artifact/v1"],
        "external": ["context", "time", "github.com/google/uuid"],
        "calls_to": ["database-layer", "supabase-client"],
        "called_by": ["cli-commands", "api-handlers"]
      },
      
      "api_contracts": [
        {
          "type": "REST",
          "endpoint": "POST /api/artifacts",
          "handler": "handler/artifact.go:CreateArtifact()",
          "request": "{ file_path: string, project_id: string }",
          "response": "{ id: string, created_at: string }"
        },
        {
          "type": "gRPC",
          "service": "ArtifactService",
          "method": "GetArtifact",
          "proto": "proto/artifact/v1/artifact.proto"
        }
      ],
      
      "integration_points": [
        "Supabase database (artifacts, checkpoints tables)",
        "GitHub API (fetch commit metadata)",
        "File system (read file content)"
      ],
      
      "complexity": "high",
      "priority": 1,
      "notes": [
        "Core domain model - foundational for other modules",
        "Heavy database interaction - 15+ queries",
        "Needs spec to clarify checkpoint versioning strategy"
      ]
    }
  ],
  
  "dependency_graph": {
    "artifact-tracking": ["database-layer", "supabase-client"],
    "github-webhook": ["artifact-tracking", "change-tracking"],
    "cli-commands": ["artifact-tracking", "change-tracking", "config-management"]
  },
  
  "recommendations": {
    "suggested_adoption_order": [
      "1. artifact-tracking (foundation)",
      "2. change-tracking (depends on artifacts)",
      "3. github-webhook (orchestrates both)"
    ],
    "high_priority_modules": ["artifact-tracking", "github-webhook"],
    "warnings": [
      "cli-commands has 3 different config formats - needs consolidation spec",
      "github-webhook has no error handling for network failures"
    ]
  }
}
```

### Phase 6: Present Results to User

Display modules in formatted table with adoption guidance:

```markdown
# Module Audit Complete

Found **{N} modules** in this codebase:

| # | Module ID | Module Name | Type | LOC | Files | Complexity | Key Functions |
|---|-----------|-------------|------|-----|-------|------------|---------------|
| ... | ... | ... | ... | ... | ... | ... | ... |

**Results saved to:** `scripts/audit-cache.json`

**Next Steps:**
To create specification for a module, run:
```bash
/specledger.adopt --module-id [MODULE_ID] --from-audit
```

**Recommended adoption order:**
{Generated from dependency graph analysis}

**Note:** Process ONE module at a time. Each `/specledger.adopt` creates one spec.md file.
```

### Phase 7: Save Audit Cache

Write results to `scripts/audit-cache.json` for later use by adopt command.

**IMPORTANT:** This command ONLY discovers and maps modules. It does NOT create spec files.

To create specs, user must run `/specledger.adopt` separately for each desired module.

## Quality Assurance Checklist

Before outputting audit results, verify:

- [ ] Every module has at least 3 key functions identified (with signatures)
- [ ] Every module has at least 1 data model (if applicable)
- [ ] Dependencies are traced through actual import statements (not guessed)
- [ ] LOC counts match actual file analysis (not estimated)
- [ ] API contracts extracted from real route definitions (not assumed)
- [ ] Entry points are verified to exist and be callable
- [ ] No module description uses vague terms like "handles stuff" or "manages things"
- [ ] All file paths referenced actually exist in the codebase

## Error Handling

**If project type cannot be determined:**
```
ERROR: Unable to detect project type. Expected one of:
- package.json (Node.js/TypeScript)
- go.mod (Go)
- requirements.txt (Python)
- Cargo.toml (Rust)

Found none. Is this a valid project root?
```

**If no modules detected:**
```
WARNING: No logical modules detected. Possible reasons:
1. Project is too small (< 500 LOC)
2. Flat file structure (no subdirectories)
3. All code in single file

Recommendation: Run `/specledger.bootstrap` instead to create project-wide spec.
```

**If module has no clear entry point:**
```
WARNING: Module "[NAME]" has no identifiable entry point.
Detected files: [list]
Unable to determine how this module is invoked.

Action needed:
1. Manually identify entry point
2. Provide to `/specledger.adopt --entry-point [FILE:FUNCTION]`
```

## Output Files

This command creates:
```
scripts/
  audit-cache.json          # Full analysis results (machine-readable)
  audit-report.md           # Human-readable summary (if --format markdown)
  module-graph.dot          # Dependency graph (Graphviz format)
```

## Usage Examples

**Basic audit:**
```bash
/specledger.audit
# → Analyzes codebase
# → Outputs JSON to scripts/audit-cache.json
# → Shows module list with IDs
```

**Then adopt specific module:**
```bash
/specledger.adopt --module-id artifact-tracking --from-audit
# → Reads scripts/audit-cache.json
# → Generates specs/001-artifact-tracking/spec.md
```

**Adopt another module:**
```bash
/specledger.adopt --module-id github-webhook --from-audit  
# → Generates specs/002-github-webhook/spec.md
```

**Process modules one-by-one** (NOT batch!)

**Scope-limited audit:**
```bash
/specledger.audit --scope packages/frontend/
# → Only analyze specific directory
```

## Integration with Other Commands

After audit completes, run adopt per module:

```bash
# Step 1: Discover modules
/specledger.audit

# Step 2: Create spec for module #1
/specledger.adopt --module-id artifact-tracking --from-audit
# → Creates specs/001-artifact-tracking/spec.md

# Step 3: Create spec for module #2
/specledger.adopt --module-id github-webhook --from-audit
# → Creates specs/002-github-webhook/spec.md

# Step 4: Plan implementation for specific module
/specledger.plan --module-id artifact-tracking
# → Creates plan.md, tasks.md for module #1

# Step 5: Clarify another module
/specledger.clarify --module-id github-webhook
# → Resolves [NEEDS CLARIFICATION] in module #2 spec
```

**Critical:** Each step processes ONE module at a time, just like `/specledger.specify` does.

## Performance Notes

- **Small projects (< 5K LOC)**: ~5 minutes
- **Medium projects (5K-20K LOC)**: ~15 minutes  
- **Large projects (20K-100K LOC)**: ~30-45 minutes
- **Monorepos (> 100K LOC)**: May require splitting by workspace

For very large codebases, consider:
```bash
/specledger.audit --scope packages/frontend/
# → Only analyze specific directory
```

## Critical Reminders

1. **ALWAYS read actual code** - never assume from folder names
2. **Extract real function signatures** - never paraphrase or summarize
3. **Quote actual code** - copy exact lines when identifying key functions
4. **Count actual files** - never estimate LOC without running `wc -l`
5. **Trace imports** - never guess dependencies, always grep for import statements
6. **Test entry points** - verify they can actually be called/executed

This is **evidence-based architecture recovery**, not guesswork.

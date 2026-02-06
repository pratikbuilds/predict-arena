# Agent Documentation Structure

This document explains the complete agent documentation system for PredictArena.

## Documentation Files

### 1. **SKILL.md** (Primary Documentation)

**Location**: `/SKILL.md`  
**Web endpoint**: `https://predictarena.dev/skill.md`

**Purpose**: Comprehensive agent skill documentation following industry best practices (DFlow pattern, Colosseum agent hackathon standards).

**Contents**:
- Complete setup and installation guide
- Environment configuration with all required variables
- Full command reference with all options
- Step-by-step workflows for common tasks
- Error handling and troubleshooting
- Best practices for autonomous agents
- JSON output schemas and examples
- Known mints and constants
- Testing and validation guidance

**When to use**: Start here. This is the authoritative, complete guide for agents integrating with PredictArena.

### 2. **AGENTS.md** (Quick Reference)

**Location**: `/AGENTS.md`

**Purpose**: Quick reference guide for agents already familiar with the system. Used by Cursor and other IDEs as a workspace rule.

**Contents**:
- First-time setup checklist
- Essential commands (wallet, discovery, trade)
- Common workflows (open position, close position)
- Known mints
- Best practices summary
- References SKILL.md for detailed documentation

**When to use**: Quick lookups and workspace-level agent guidance. Not a replacement for SKILL.md.

### 3. **llms.txt** (Documentation Index)

**Location**: `/llms.txt`  
**Web endpoint**: `https://predictarena.dev/llms.txt`

**Purpose**: Structured index of all documentation and source code for agent discovery. Follows the [llms.txt](https://llmstxt.org/) standard.

**Contents**:
- Overview of the project
- Links to key documentation files
- Source code file descriptions
- External resource links (DFlow docs, APIs)
- Quick start guide
- Environment variables reference

**When to use**: When agents need to discover what documentation is available, navigate the codebase, or find specific API references.

### 4. **README.md** (Human Documentation)

**Location**: `/README.md`

**Purpose**: Human-readable project documentation with prominent links to agent documentation at the top.

**Contents**:
- Project overview
- Installation and build instructions
- Usage examples
- Links to SKILL.md, AGENTS.md, and llms.txt

**When to use**: Introduction to the project, human developers reading on GitHub.

## Web Endpoints

The web application serves agent documentation at these endpoints:

- `GET /skill.md` - Serves the complete SKILL.md file
- `GET /llms.txt` - Serves the documentation index

Both endpoints:
- Cache for 1 hour (`Cache-Control: public, max-age=3600`)
- Serve directly from the root directory files (single source of truth)
- Return 404 if files are missing

## Documentation Hierarchy

```
┌─────────────────────────────────────────────────┐
│                   llms.txt                      │
│      (Discovery: What docs are available?)      │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼──────┐
│   SKILL.md     │    │   README.md   │
│ (Comprehensive)│    │    (Human)    │
└───────┬────────┘    └───────────────┘
        │
        │ references
        │
┌───────▼────────┐
│   AGENTS.md    │
│ (Quick Ref)    │
└────────────────┘
```

## Agent Integration Patterns

### Pattern 1: First-time agent (comprehensive)

1. Agent discovers project has agent documentation
2. Fetches `llms.txt` to understand available docs
3. Reads `SKILL.md` from top to bottom
4. Follows setup checklist step-by-step
5. Uses command reference for specific tasks
6. References error handling section when issues occur

### Pattern 2: Experienced agent (quick reference)

1. Agent already knows PredictArena
2. Uses `AGENTS.md` for quick command lookups
3. References `SKILL.md` only for advanced features
4. Falls back to `llms.txt` to find source code

### Pattern 3: IDE workspace integration (Cursor, etc.)

1. IDE loads `AGENTS.md` as a workspace rule
2. Agent uses quick reference for common tasks
3. Links to `SKILL.md` when more detail is needed
4. Follows best practices enforced in AGENTS.md

### Pattern 4: Web-based discovery

1. Agent makes HTTP request to `https://predictarena.dev/llms.txt`
2. Discovers available documentation endpoints
3. Fetches `https://predictarena.dev/skill.md` for complete guide
4. Follows URLs to DFlow docs for API details

## Maintenance

When updating agent documentation:

### Update SKILL.md when:
- Adding new CLI commands
- Changing command options or behavior
- Adding new workflows
- Updating environment variables
- Changing error handling
- Adding new best practices

### Update AGENTS.md when:
- Changing essential commands
- Updating common workflows
- Changing known mints
- Updating setup process

### Update llms.txt when:
- Adding new documentation files
- Adding new source code files
- Changing external resource URLs
- Restructuring the codebase

### Update web routes when:
- Moving documentation files
- Changing documentation format
- Adding new documentation endpoints

## Validation Checklist

Before committing documentation changes:

- [ ] All command examples are tested and work
- [ ] All JSON output examples match actual output
- [ ] Environment variables are accurate
- [ ] Links between documents are valid
- [ ] Web routes serve the correct files
- [ ] SKILL.md metadata (name, version, description) is current
- [ ] Known mints are up to date
- [ ] Error handling covers common failure modes
- [ ] Best practices reflect current recommendations

## References

### Industry Standards
- **llms.txt**: https://llmstxt.org/ - Documentation discovery standard
- **DFlow skill.md**: https://pond.dflow.net/skill.md - Pattern reference for trading skills
- **Colosseum Agent Hackathon**: https://colosseum.com/agent-hackathon/ - Agent skill requirements

### PredictArena Resources
- **SKILL.md**: Complete agent documentation
- **AGENTS.md**: Quick reference guide
- **llms.txt**: Documentation index
- **README.md**: Project documentation
- **Web API**: `/skill.md` and `/llms.txt` endpoints

### External APIs
- **DFlow Trade API**: https://docs.dflow.net/build/trading-api/introduction
- **DFlow Metadata API**: https://docs.dflow.net/build/metadata-api/introduction
- **DFlow AI Coding Resources**: https://pond.dflow.net/build/ai-coding

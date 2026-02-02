# Agent Memory Bank

I am an AI agent with a unique characteristic: my memory resets completely between sessions. This isn't a limitation - it's what drives me to maintain perfect documentation. After each reset, I rely ENTIRELY on my Memory Bank to understand the project and continue work effectively. I MUST read ALL memory bank files at the start of EVERY task - this is not optional.

## Memory Bank Structure

The Memory Bank consists of core files and optional context files, all in Markdown format. Files build upon each other in a clear hierarchy:

```
memory-bank/
├── projectbrief.md      # Foundation - core requirements and goals
├── productContext.md    # Why this exists, problems it solves
├── techContext.md       # Technologies, setup, constraints
├── systemPatterns.md    # Architecture, patterns, decisions
├── activeContext.md     # Current focus, recent changes, next steps
├── progress.md          # What works, what's left, status
└── features/            # Complex feature documentation
    └── animals.md       # Animal system details
```

### Core Files (Required)

1. **projectbrief.md** - Foundation document that shapes all other files
2. **productContext.md** - Why this project exists and how it should work
3. **activeContext.md** - Current work focus and active decisions
4. **systemPatterns.md** - Architecture and design patterns
5. **techContext.md** - Technologies and development setup
6. **progress.md** - What works, what's left, current status

## Core Workflows

### Starting a Session
1. Read ALL memory bank files
2. Verify understanding of current state
3. Check progress.md for next steps
4. Continue from where previous session left off

### During Work
1. Execute tasks with full context
2. Document significant changes
3. Update activeContext.md with learnings

### Ending a Session / Update Memory Bank
When user requests **update memory bank**:
1. Review ALL memory bank files
2. Document current state accurately
3. Update progress.md with completed work
4. Clarify next steps in activeContext.md
5. Document any new patterns or insights

## Documentation Standards

- Be precise and factual
- Include file paths and code references
- Document both successes and failures
- Keep progress.md as the single source of truth for status
- Update activeContext.md with any important learnings

## Project-Specific Notes

This is **Farm Follies** - a physics-based stacking arcade game. Key areas:
- Game engine architecture (modular refactor in progress)
- Animal system with variants and abilities
- Wobble physics for stack stability
- Tornado spawning system

REMEMBER: After every memory reset, I begin completely fresh. The Memory Bank is my only link to previous work. It must be maintained with precision and clarity.

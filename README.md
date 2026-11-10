# Subway Surfers Reverse Engineering Research

An evidence-driven research repository for examining the actual Subway Surfers application: packaging, architecture, runtime behaviour, rendering, movement, physics, networking, and asset pipeline.

**This is not a game, clone, remake, or inspired-by prototype.** It contains original research notes, analysis metadata, reproducible experiments, and tooling—not the game's proprietary source code.

## Objectives
- Identify engine, frameworks, dependencies, and build/package structure for specific releases.
- Examine lawfully obtained application packages and metadata.
- Investigate runtime behaviour and game mechanics.
- Analyse rendering, movement, collision, physics, spawning, and performance.
- Automate repeatable analysis and document evidence-backed findings.

## Structure
- `research/`: architecture and subsystem research
- `analysis/`: APK, binaries, metadata, dependencies, runtime
- `experiments/`: movement, collision, spawning, performance
- `tooling/`: original scripts and parsers
- `findings/`: confirmed facts, hypotheses, unknowns
- `docs/`: methodology and references

## Evidence standard
Every finding must identify the target platform/build, sample SHA-256 where applicable, acquisition/examination method, tool versions, observation, supporting evidence, reproduction steps, limitations, and confidence status. Keep confirmed observations separate from hypotheses and unknowns.

## Legal boundary
The MIT License applies only to original research code and documentation authored here. It does **not** grant rights to Subway Surfers source code, binaries, trademarks, artwork, audio, or other proprietary material. Do not commit or redistribute APKs, proprietary binaries, extracted assets, credentials, or personal data. Examine only samples you are legally entitled to access and comply with applicable laws and platform terms.

Start with [methodology](docs/methodology.md) and [references](docs/references.md). No game runtime or prototype belongs in this repository.

# Research methodology

## Scope
Study the actual Subway Surfers application, not a reimplementation. Identify platform, release, package identity, version, acquisition source, and sample SHA-256 before drawing conclusions. Keep releases and platforms distinct.

## Acquisition and preservation
Use only samples you are legally entitled to access. Record provenance, timestamp, file size, and cryptographic hashes. Preserve an untouched reference sample outside version control. Do not commit APKs, proprietary binaries/assets, credentials, or personal data.

## Static examination
Inspect package manifests, metadata, signing information, dependency indicators, binary formats, strings, symbols, and resource/container structure. Record tool names/versions and relevant outputs. Treat heuristic detections as leads, not proof.

## Runtime observation
Use controlled conditions. Record device/OS, app build, display settings, network state, instrumentation method, and exact action sequence. Redact identifiers, tokens, and personal information.

## Experiments
Define a question and falsifiable hypothesis before testing. Change one variable at a time where practical. Repeat trials, preserve raw measurements, describe sampling and uncertainty, and include analysis scripts. Report negative results and failed reproductions.

## Evidence classes
- **Confirmed:** directly supported by repeatable observation or authoritative artefact evidence for a specified build.
- **Hypothesis:** plausible interpretation not sufficiently tested.
- **Unknown:** evidence is absent, ambiguous, inaccessible, or contradictory.

A conclusion is confirmed only for the build and conditions actually examined. Do not generalize across versions without comparison evidence.

## Finding template
Include ID/title; status; target platform/version/build/sample SHA-256; date/environment; method/tools/versions; observation/evidence; interpretation/alternatives/confidence; reproduction steps; limitations/next steps.

## Legal and security boundaries
MIT covers only original project contributions, not Subway Surfers intellectual property. Do not redistribute proprietary source, binaries, artwork, audio, extracted assets, or confidential data. Do not publish secrets or personal data or bypass access controls. Follow applicable law and platform terms.

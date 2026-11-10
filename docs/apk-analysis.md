# APK static-analysis workflow

## Scope

The first-stage inspector is read-only and standard-library-only. It hashes the sample, inventories ZIP members, identifies DEX and native-library paths, counts asset directory roots, and parses AndroidManifest.xml only when it is plain XML.

It does not extract files, execute code, bypass protections, inspect encrypted content, or infer undocumented game logic. Production APK manifests are commonly Android binary XML; those are reported as such rather than guessed.

## Run

~~~sh
python3 tooling/scripts/apk_inspect.py /path/to/base.apk --output analysis/metadata/sample-report.json
python3 -m unittest discover -s tooling/tests -v
~~~

Keep the APK outside the repository. Review generated reports for personal data, local paths, and sensitive metadata before committing. Never commit the APK, extracted assets, or proprietary binaries.

## Optional Android SDK follow-up

For a binary manifest, use trusted Android SDK command-line tools locally:

~~~sh
apkanalyzer manifest print /path/to/base.apk
apkanalyzer apk summary /path/to/base.apk
~~~

Record exact tool versions and commands. A filename or single library is not conclusive proof of the engine; corroborate candidate indicators with independent metadata and runtime observations.

## Evidence record

For each sample, record acquisition source/date and lawful-access basis, package/version/platform when established, SHA-256 and byte size, tool name/version and exact commands, observed facts separately from hypotheses, report path, reproduction steps, and limitations.

Engine indicators in the report are heuristic leads, not confirmed findings.

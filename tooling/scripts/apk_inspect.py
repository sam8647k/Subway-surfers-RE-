#!/usr/bin/env python3
"""Read-only APK metadata inspector. Uses only the Python standard library."""
from __future__ import annotations
import argparse, hashlib, json, re, sys, zipfile
from collections import Counter
from pathlib import Path, PurePosixPath
from typing import Any
import xml.etree.ElementTree as ET

ANDROID_NS = "{http://schemas.android.com/apk/res/android}"
MAX_MANIFEST_BYTES = 8 * 1024 * 1024
MAX_ENTRIES = 200_000
MAX_TOTAL_UNCOMPRESSED = 8 * 1024 * 1024 * 1024
MAX_RATIO_WARNING = 1_000

def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def safe_member_name(name: str) -> bool:
    p = PurePosixPath(name)
    return not p.is_absolute() and ".." not in p.parts and not re.match(r"^[A-Za-z]:", name)

def parse_manifest(zf: zipfile.ZipFile, names: set[str]) -> dict[str, Any]:
    if "AndroidManifest.xml" not in names:
        return {"status": "missing"}
    info = zf.getinfo("AndroidManifest.xml")
    if info.file_size > MAX_MANIFEST_BYTES:
        return {"status": "not_parsed", "reason": "manifest exceeds safety size limit"}
    raw = zf.read("AndroidManifest.xml")
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return {"status": "binary_or_unrecognized", "reason": "Manifest is not plain XML; use Android SDK apkanalyzer or aapt2", "raw_size": len(raw)}
    application, uses_sdk = root.find("application"), root.find("uses-sdk")
    return {
        "status": "parsed_text_xml", "package": root.attrib.get("package"),
        "version_code": root.attrib.get(ANDROID_NS + "versionCode"),
        "version_name": root.attrib.get(ANDROID_NS + "versionName"),
        "compile_sdk_version": root.attrib.get(ANDROID_NS + "compileSdkVersion"),
        "min_sdk": uses_sdk.attrib.get(ANDROID_NS + "minSdkVersion") if uses_sdk is not None else None,
        "target_sdk": uses_sdk.attrib.get(ANDROID_NS + "targetSdkVersion") if uses_sdk is not None else None,
        "application_class": application.attrib.get(ANDROID_NS + "name") if application is not None else None,
        "label": application.attrib.get(ANDROID_NS + "label") if application is not None else None,
    }

def inspect_apk(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(path)
    digest, warnings, inventory = sha256_file(path), [], []
    dex_files, native_libs, hints = [], [], []
    asset_roots, total_uncompressed = Counter(), 0
    with zipfile.ZipFile(path, "r") as zf:
        infos = zf.infolist()
        if len(infos) > MAX_ENTRIES:
            raise ValueError(f"Archive has {len(infos)} entries; safety limit is {MAX_ENTRIES}")
        names = {i.filename for i in infos}
        duplicate_names = len(names) != len(infos)
        if duplicate_names:
            warnings.append("Archive contains duplicate member names")
        for info in infos:
            name = info.filename
            if not safe_member_name(name):
                warnings.append(f"Unsafe archive path observed (not extracted): {name!r}")
            total_uncompressed += info.file_size
            if info.file_size and info.compress_size == 0:
                warnings.append(f"Suspicious zero compressed size: {name}")
            elif info.compress_size and info.file_size / info.compress_size > MAX_RATIO_WARNING:
                warnings.append(f"Extreme compression ratio: {name}")
            if name.endswith("/") or not safe_member_name(name):
                continue
            inventory.append({"path": name, "compressed_bytes": info.compress_size, "uncompressed_bytes": info.file_size, "compression": info.compress_type})
            base = name.rsplit("/", 1)[-1]
            if re.fullmatch(r"classes(?:\d+)?\.dex", base):
                dex_files.append(name)
            if name.startswith("lib/") and name.endswith(".so"):
                parts = name.split("/")
                if len(parts) >= 3:
                    native_libs.append({"abi": parts[1], "path": name})
            if name.startswith("assets/"):
                parts = name.split("/")
                if len(parts) > 1:
                    asset_roots[parts[1]] += 1
            low = name.lower()
            if any(x in low for x in ("libunity.so", "unityplayer", "globalgamemanagers", "data.unity3d")):
                hints.append({"indicator": name, "candidate": "Unity-related packaging indicator"})
            if any(x in low for x in ("libil2cpp.so", "global-metadata.dat")):
                hints.append({"indicator": name, "candidate": "IL2CPP-related indicator"})
            if any(x in low for x in ("libue4.so", "libunreal.so", "ue4commandline.txt")):
                hints.append({"indicator": name, "candidate": "Unreal-related packaging indicator"})
        if total_uncompressed > MAX_TOTAL_UNCOMPRESSED:
            warnings.append("Declared uncompressed size exceeds 8 GiB; archive was inventoried but not extracted")
        manifest = parse_manifest(zf, names)
    if not dex_files:
        warnings.append("No classes*.dex entry found in archive inventory")
    if manifest["status"] == "binary_or_unrecognized":
        warnings.append("Binary Android manifest requires Android SDK tooling for decoded package/version/SDK fields")
    unique_hints, seen = [], set()
    for hint in hints:
        key = (hint["indicator"], hint["candidate"])
        if key not in seen:
            seen.add(key)
            unique_hints.append(hint)
    return {
        "schema_version": 1,
        "sample": {"filename": path.name, "size_bytes": path.stat().st_size, "sha256": digest, "analysis_mode": "read_only_archive_inventory"},
        "manifest": manifest,
        "archive": {"entry_count": len(inventory), "declared_uncompressed_bytes": total_uncompressed,
                    "duplicate_member_names": duplicate_names, "dex_files": sorted(dex_files),
                    "native_libraries": sorted(native_libs, key=lambda x: (x["abi"], x["path"])),
                    "asset_top_level_counts": dict(sorted(asset_roots.items())), "entries": inventory},
        "engine_indicators": {"status": "heuristic_only", "indicators": unique_hints,
            "interpretation": "Filename indicators are leads, not proof of engine or runtime architecture. Corroborate with metadata, libraries, symbols, and runtime evidence."},
        "warnings": warnings,
    }

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("apk", type=Path, help="Lawfully obtained APK; this tool never uploads it")
    parser.add_argument("-o", "--output", type=Path, help="Write JSON report (default: stdout)")
    args = parser.parse_args()
    try:
        report = inspect_apk(args.apk)
        rendered = json.dumps(report, indent=2, sort_keys=True) + "\n"
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(rendered, encoding="utf-8")
            print(f"Wrote report: {args.output}")
        else:
            sys.stdout.write(rendered)
        return 0
    except (OSError, zipfile.BadZipFile, ValueError, RuntimeError) as exc:
        print(f"apk_inspect: error: {exc}", file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())

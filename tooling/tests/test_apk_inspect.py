import tempfile
import unittest
import zipfile
from pathlib import Path
from apk_inspect import inspect_apk, safe_member_name

class ApkInspectTests(unittest.TestCase):
    def make_apk(self, root: Path, manifest: bytes) -> Path:
        path = root / "sample.apk"
        with zipfile.ZipFile(path, "w") as zf:
            zf.writestr("AndroidManifest.xml", manifest)
            zf.writestr("classes.dex", b"dex-placeholder")
            zf.writestr("lib/arm64-v8a/libsample.so", b"native-placeholder")
            zf.writestr("assets/example/config.json", b"{}")
        return path

    def test_text_manifest_and_inventory(self):
        xml = b'''<manifest xmlns:android="http://schemas.android.com/apk/res/android"
          package="example.test" android:versionCode="7" android:versionName="1.2">
          <uses-sdk android:minSdkVersion="23" android:targetSdkVersion="35"/>
          <application android:name=".App" android:label="Example"/>
        </manifest>'''
        with tempfile.TemporaryDirectory() as tmp:
            report = inspect_apk(self.make_apk(Path(tmp), xml))
        self.assertEqual(report["manifest"]["package"], "example.test")
        self.assertEqual(report["manifest"]["version_name"], "1.2")
        self.assertEqual(report["archive"]["dex_files"], ["classes.dex"])
        self.assertEqual(report["archive"]["native_libraries"][0]["abi"], "arm64-v8a")
        self.assertEqual(report["archive"]["asset_top_level_counts"], {"example": 1})
        self.assertEqual(len(report["sample"]["sha256"]), 64)

    def test_binary_manifest_is_reported_not_guessed(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = inspect_apk(self.make_apk(Path(tmp), b"\x03\x00\x08\x00binary"))
        self.assertEqual(report["manifest"]["status"], "binary_or_unrecognized")

    def test_path_traversal_detection(self):
        self.assertFalse(safe_member_name("../outside"))
        self.assertFalse(safe_member_name("/absolute"))
        self.assertTrue(safe_member_name("assets/safe/file.bin"))

if __name__ == "__main__":
    unittest.main()

# Tooling tests

Run from the repository root:

~~~sh
python -m unittest discover -s tooling/tests -v
~~~

Tests create synthetic APK-like ZIP archives and do not require or include Subway Surfers binaries or assets.

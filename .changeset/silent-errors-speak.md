---
'clean-modules': minor
---

Surface non-fatal filesystem failures instead of swallowing them silently.

- `CleanResult` now includes:
  - `failures: CleanFailure[]` describing files that could not be processed (e.g. `EACCES`, `EBUSY`).
  - `removedFilesCount: number` reflecting the number of files actually removed. Previously `files.length` was used as a stand-in even when some removals failed.
- The CLI prints a summary of failures below the usual results; the full list is included in `--json` output.
- New `--fail-on-error` flag exits with a non-zero status code when any failure is recorded. Exit code stays `0` by default, matching prior behavior.
- `ENOENT` during `stat`, `unlink`, or `readdir` is still treated as a no-op since the file or directory is already gone. Other errors are now captured rather than silently dropped.

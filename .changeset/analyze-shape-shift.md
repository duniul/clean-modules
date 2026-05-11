---
'clean-modules': major
---

**BREAKING** `analyze()` now returns `{ files, failures }` instead of an array of per-file results.

The previous per-file type was renamed from `AnalyzeResult` to `AnalyzedFile`, and `AnalyzeResult` now refers to the top-level `{ files: AnalyzedFile[], failures: CleanFailure[] }` shape. This mirrors the structure of `CleanResult` and lets `analyze` report the same crawl failures that `clean` now surfaces.

Migration:

```ts
// Before
const results = await analyze();
for (const file of results) {
  /* ... */
}

// After
const { files } = await analyze();
for (const file of files) {
  /* ... */
}
```

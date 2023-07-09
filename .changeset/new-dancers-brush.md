---
'clean-modules': major
---

**BREAKING** Replace `-i,--include` and `-e,--exclude` with globs passed as positional arguments. This makes them consistent with the glob file patterns.

To migrate, move included and excluded globs to the end of the command, and prefix any exclusion globs with `!`.

```sh
# before
clean-modules --include "foo" "bar" --exclude "baz" "qux"

# after
clean-modules "foo" "bar" "!baz" "!qux"
```

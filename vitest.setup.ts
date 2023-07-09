import { vol } from 'memfs';
import { afterEach, expect, vi } from 'vitest';
import { pathSerializer } from './src/__test__/path.serializer.js';

vi.mock('fs');
vi.mock('fs/promises');

expect.addSnapshotSerializer(pathSerializer);

afterEach(() => {
  vol.reset();
});

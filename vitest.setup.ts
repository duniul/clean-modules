import { vol } from 'memfs';
import { afterEach, vi } from 'vitest';

vi.mock('fs');
vi.mock('fs/promises');

afterEach(() => {
  vol.reset();
});

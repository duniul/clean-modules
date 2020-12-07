const mockFs = require('mock-fs');

afterEach(() => {
  mockFs.restore();
});

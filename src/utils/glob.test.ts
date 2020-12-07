import pm from 'picomatch';
import { makeGlobber } from './glob';

jest.mock('picomatch');

const mockedPm = (pm as unknown) as jest.Mock<typeof pm>;

describe('makeGlobber', () => {
  it('creates a picomatch globber with default options', () => {
    const globMock = 'globber';
    mockedPm.mockReturnValueOnce((globMock as unknown) as typeof pm);
    const pattern = '**/**';
    const globber = makeGlobber(pattern);
    expect(pm).toHaveBeenCalledWith(pattern, { dot: true, nocase: true });
    expect(globber).toBe(globMock);
  });
});

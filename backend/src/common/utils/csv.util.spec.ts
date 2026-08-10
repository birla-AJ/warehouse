import { CsvUtil } from './csv.util';

describe('CsvUtil', () => {
  it('returns an empty string for no rows', () => {
    expect(CsvUtil.toCsv([])).toBe('');
  });

  it('produces a header row from the first object keys', () => {
    const csv = CsvUtil.toCsv([{ name: 'Ramesh', amount: 100 }]);
    expect(csv.split('\n')[0]).toBe('name,amount');
    expect(csv.split('\n')[1]).toBe('Ramesh,100');
  });

  it('quotes and escapes values containing commas or quotes', () => {
    const csv = CsvUtil.toCsv([{ note: 'wet, damaged "bag"' }]);
    expect(csv).toBe('note\n"wet, damaged ""bag"""');
  });

  it('renders null/undefined as empty strings', () => {
    const csv = CsvUtil.toCsv([{ a: null, b: undefined, c: 1 }]);
    expect(csv.split('\n')[1]).toBe(',,1');
  });
});

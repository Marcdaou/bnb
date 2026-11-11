import { describe, expect, it } from 'vitest';
import { isIsoDate, overlaps, parseDateRange, parseGuests, parsePrice } from './search';

describe('overlaps (R3)', () => {
  const r = { check_in: '2027-06-10', check_out: '2027-06-14' };
  it('partial overlap', () => expect(overlaps(r, '2027-06-12', '2027-06-16')).toBe(true));
  it('search contained in booking', () => expect(overlaps(r, '2027-06-11', '2027-06-13')).toBe(true));
  it('booking contained in search', () => expect(overlaps(r, '2027-06-01', '2027-06-30')).toBe(true));
  it('touching at search check-in is not overlap', () => expect(overlaps(r, '2027-06-14', '2027-06-18')).toBe(false));
  it('touching at search check-out is not overlap', () => expect(overlaps(r, '2027-06-06', '2027-06-10')).toBe(false));
  it('disjoint', () => expect(overlaps(r, '2027-07-01', '2027-07-05')).toBe(false));
});

describe('parseDateRange (R5)', () => {
  it('valid range', () => expect(parseDateRange('2027-06-12', '2027-06-16'))
    .toEqual({ range: { checkIn: '2027-06-12', checkOut: '2027-06-16' }, partial: false }));
  it('no dates', () => expect(parseDateRange('', '')).toEqual({ range: null, partial: false }));
  it.each([
    ['only check_in', '2027-06-12', ''],
    ['only check_out', '', '2027-06-16'],
    ['equal dates', '2027-06-12', '2027-06-12'],
    ['reversed', '2027-06-16', '2027-06-12'],
    ['bad month', '2027-13-01', '2027-06-16'],
    ['garbage', 'abc', '2027-06-16'],
    ['non-existent day', '2027-02-30', '2027-03-02'],
  ])('%s -> partial, no range', (_, a, b) => expect(parseDateRange(a, b)).toEqual({ range: null, partial: true }));
  it('isIsoDate accepts leap day', () => expect(isIsoDate('2028-02-29')).toBe(true));
});

describe('parsePrice (R9)', () => {
  it.each([['', null], ['abc', null], ['80', 80], ['0', 0], ['-5', null], [null, null]] as const)(
    '%s -> %s', (input, out) => expect(parsePrice(input)).toBe(out));
});

describe('parseGuests (R6)', () => {
  it.each([['0', 0], ['abc', 0], ['4', 4], ['2.5', 0], [null, 0]] as const)(
    '%s -> %s', (input, out) => expect(parseGuests(input)).toBe(out));
});

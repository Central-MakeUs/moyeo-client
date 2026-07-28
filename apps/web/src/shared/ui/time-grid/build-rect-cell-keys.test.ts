import { describe, it, expect } from 'vitest';

import { buildRectCellKeys } from './build-rect-cell-keys';

const COLUMNS = ['2026-07-10', '2026-07-11', '2026-07-12'];
const ROWS = ['18:00', '19:00', '20:00'];

const build = (anchorKey: string, currentKey: string) =>
  buildRectCellKeys({ anchorKey, currentKey, columns: COLUMNS, rows: ROWS });

describe('buildRectCellKeys', () => {
  it('should return the 4 cells of the rectangle when dragging 2026-07-10 18:00 to 2026-07-11 19:00', () => {
    expect(build('2026-07-10 18:00', '2026-07-11 19:00')).toEqual([
      '2026-07-10 18:00',
      '2026-07-10 19:00',
      '2026-07-11 18:00',
      '2026-07-11 19:00',
    ]);
  });

  it('should return the same 4 cells when dragging in reverse from 2026-07-11 19:00 to 2026-07-10 18:00', () => {
    expect(build('2026-07-11 19:00', '2026-07-10 18:00')).toEqual(
      build('2026-07-10 18:00', '2026-07-11 19:00')
    );
  });

  it('should return only the anchor cell when anchor and current are the same', () => {
    expect(build('2026-07-10 18:00', '2026-07-10 18:00')).toEqual(['2026-07-10 18:00']);
  });

  it('should return a single column run when the drag stays in one date', () => {
    expect(build('2026-07-10 18:00', '2026-07-10 20:00')).toEqual([
      '2026-07-10 18:00',
      '2026-07-10 19:00',
      '2026-07-10 20:00',
    ]);
  });

  it('should return a single row run when the drag stays in one time', () => {
    expect(build('2026-07-10 19:00', '2026-07-12 19:00')).toEqual([
      '2026-07-10 19:00',
      '2026-07-11 19:00',
      '2026-07-12 19:00',
    ]);
  });

  it('should span every cell when dragging corner to corner', () => {
    expect(build('2026-07-10 18:00', '2026-07-12 20:00')).toHaveLength(9);
  });

  it('should return [] when the anchor is not in the grid', () => {
    expect(build('2026-08-01 18:00', '2026-07-10 18:00')).toEqual([]);
  });

  it('should return [] when the current cell is not in the grid', () => {
    expect(build('2026-07-10 18:00', '2026-07-10 23:00')).toEqual([]);
  });

  it('should return [] when a key is malformed', () => {
    expect(build('garbage', '2026-07-10 18:00')).toEqual([]);
  });
});

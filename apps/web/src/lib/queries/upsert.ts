import { getColumns, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

/**
 * Build an `onConflictDoUpdate` set object from a table definition, pointing
 * each named column at its `excluded` (incoming) value, so the column list is
 * never hand-written twice. See the Drizzle upsert guide.
 *
 * Tables are declared with `snakeCase.table`, so `Column.name` already holds
 * the real snake_case DB name the `excluded.` pseudo-row needs.
 */
export function excludedColumns<TTable extends PgTable>(
  table: TTable,
  columns: readonly (keyof TTable["_"]["columns"] & string)[],
): Record<string, SQL> {
  const cols = getColumns(table);
  const set: Record<string, SQL> = {};
  for (const column of columns) {
    set[column] = sql.raw(`excluded.${cols[column].name}`);
  }
  return set;
}

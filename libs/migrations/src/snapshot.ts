import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CreateSnapshotOptions {
  /** PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/dbname) */
  connectionString: string;
  /** Output file path (custom format: .dump recommended; plain SQL: .sql) */
  outputPath: string;
  /** If true, dump schema only (no data). Default false. */
  schemaOnly?: boolean;
  /** Path to pg_dump executable. Default: "pg_dump". */
  pgDumpPath?: string;
}

/**
 * Creates a database snapshot using pg_dump. Requires PostgreSQL client tools on PATH.
 * Uses custom format (-Fc) by default for compatibility with pg_restore (clean, parallel, etc.).
 *
 * @throws If pg_dump exits with non-zero or is not found
 */
export async function createSnapshot(
  options: CreateSnapshotOptions
): Promise<{ stdout: string; stderr: string }> {
  const {
    connectionString,
    outputPath,
    schemaOnly = false,
    pgDumpPath = 'pg_dump',
  } = options;

  const args: string[] = ['-Fc', '-f', outputPath];
  if (schemaOnly) {
    args.push('--schema-only');
  }
  args.push(connectionString);

  const { stdout, stderr } = await execFileAsync(pgDumpPath, args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  return { stdout, stderr };
}

export interface RestoreSnapshotOptions {
  /** PostgreSQL connection string for the target database */
  connectionString: string;
  /** Path to the dump file (custom or directory format from pg_dump -Fc) */
  inputPath: string;
  /** If true, drop objects before restoring (--clean --if-exists). Default false. */
  clean?: boolean;
  /** Path to pg_restore executable. Default: "pg_restore". */
  pgRestorePath?: string;
}

/**
 * Restores a database from a snapshot file created by createSnapshot (pg_dump -Fc).
 * Requires pg_restore on PATH.
 *
 * @throws If pg_restore exits with non-zero or is not found
 */
export async function restoreSnapshot(
  options: RestoreSnapshotOptions
): Promise<{ stdout: string; stderr: string }> {
  const {
    connectionString,
    inputPath,
    clean = false,
    pgRestorePath = 'pg_restore',
  } = options;

  const args: string[] = ['-d', connectionString];
  if (clean) {
    args.push('--clean', '--if-exists');
  }
  args.push(inputPath);

  const { stdout, stderr } = await execFileAsync(pgRestorePath, args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  return { stdout, stderr };
}

export interface ResetDatabaseOptions {
  /** PostgreSQL connection string for the target database */
  connectionString: string;
  /** Path to the dump file to restore after dropping */
  inputPath: string;
  /** Path to pg_restore. Default: "pg_restore". */
  pgRestorePath?: string;
}

/**
 * Drops all objects in the database and restores from the given snapshot.
 * Equivalent to restoreSnapshot with clean: true. Use for dev/test resets.
 *
 * @throws If pg_restore exits with non-zero
 */
export async function resetDatabase(
  options: ResetDatabaseOptions
): Promise<{ stdout: string; stderr: string }> {
  return restoreSnapshot({
    ...options,
    clean: true,
  });
}

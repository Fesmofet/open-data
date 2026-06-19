/** Thrown when a Hive Engine RPC request fails (network, timeout, or JSON-RPC error). */
export class HiveEngineUnavailableError extends Error {
  constructor(message = 'Hive Engine unavailable') {
    super(message);
    this.name = 'HiveEngineUnavailableError';
  }
}

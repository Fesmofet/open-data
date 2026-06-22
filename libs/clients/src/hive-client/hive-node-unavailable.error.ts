/** Thrown when a Hive node RPC request fails (network, timeout, or JSON-RPC error). */
export class HiveNodeUnavailableError extends Error {
  constructor(message = 'Hive node unavailable') {
    super(message);
    this.name = 'HiveNodeUnavailableError';
  }
}

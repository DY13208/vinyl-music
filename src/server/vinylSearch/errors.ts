export class ProviderUnavailableError extends Error {
  public readonly code = 'unavailable';

  public constructor(public readonly provider: string, message: string) {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

export class ProviderHttpError extends Error {
  public readonly code: string;

  public constructor(
    public readonly provider: string,
    public readonly status: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderHttpError';
    this.code = status ? `http_${status}` : message === 'timeout' ? 'timeout' : 'network_error';
  }
}

export class FetchError extends Error {
  status?: number;
  isTransient: boolean;
  constructor(message: string, status?: number, isTransient = true) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.isTransient = isTransient;
  }
}

export default FetchError;

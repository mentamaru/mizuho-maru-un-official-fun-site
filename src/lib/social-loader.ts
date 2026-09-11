/** Share in-flight work, but allow another attempt after a failure. */
export function retryableLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => pending ??= load().catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
}

export function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('表示がタイムアウトしました')), milliseconds);
    operation.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

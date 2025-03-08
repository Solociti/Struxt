declare global {
  interface Error {
    status?: number;
    statusCode?: number;
  }
}

export {};

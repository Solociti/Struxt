export {};

declare global {
  interface RegExpConstructor {
    /**
     * Escapes a string for use in a regular expression.
     * Native V8 implementation (Node.js 24+).
     *
     * @param str The string to escape.
     */
    escape(str: string): string;
  }
}

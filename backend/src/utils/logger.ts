export class Logger {
  static info(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static warn(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] [${timestamp}] ${message}`, error || '');
  }

  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.debug(`[DEBUG] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
}

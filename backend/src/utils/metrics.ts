export class MetricsTracker {
  private static startTime = Date.now();
  private static totalQueries = 0;
  private static totalDocumentsIndexed = 0;

  static recordQuery(): void {
    this.totalQueries++;
  }

  static recordDocumentUpload(chunksCount: number): void {
    this.totalDocumentsIndexed += chunksCount;
  }

  static getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  static getStats() {
    return {
      uptimeSeconds: this.getUptimeSeconds(),
      totalQueries: this.totalQueries,
      totalDocumentsIndexed: this.totalDocumentsIndexed,
    };
  }
}

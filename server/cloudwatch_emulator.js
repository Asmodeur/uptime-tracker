/**
 * Amazon CloudWatch Telemetry Emulator
 * Collects and serves custom metrics emitted during health checks
 * (Namespace: WebsiteUptimeTracker, Metrics: ResponseTime, SiteStatus)
 */

class CloudWatchEmulator {
  constructor() {
    this.metrics = [];
    this.logs = [];
    this.maxItems = 100;
  }

  recordMetric(metricName, siteName, value, unit) {
    const dataPoint = {
      id: Date.now() + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      namespace: 'WebsiteUptimeTracker',
      metricName,
      siteName,
      value,
      unit,
    };
    this.metrics.unshift(dataPoint);
    if (this.metrics.length > this.maxItems) {
      this.metrics.pop();
    }

    this.log(`[CloudWatch:PutMetricData] Namespace=WebsiteUptimeTracker Metric=${metricName} Site="${siteName}" Value=${value}${unit}`);
  }

  log(message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
    };
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxItems) {
      this.logs.pop();
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getLogs() {
    return this.logs;
  }
}

module.exports = new CloudWatchEmulator();

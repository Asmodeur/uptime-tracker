/**
 * Amazon SNS Alerting Emulator
 * Records downtime and recovery notifications dispatched to subscribers
 */

class SnsEmulator {
  constructor() {
    this.alerts = [];
    this.subscribers = [
      { protocol: 'email', endpoint: 'nilam.sikdar@example.com', status: 'Confirmed' },
      { protocol: 'sms', endpoint: '+91-9876543210', status: 'Confirmed' },
    ];
    this.maxAlerts = 50;
  }

  publish(site, alertType, details) {
    const messageId = `sns-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const notification = {
      messageId,
      timestamp: new Date().toISOString(),
      topicArn: 'arn:aws:sns:us-east-1:123456789012:WebsiteUptimeAlertsTopic',
      subject: `[ALERT - AWS Uptime Tracker] ${site.name} is ${alertType.toUpperCase()}!`,
      siteName: site.name,
      siteUrl: site.url,
      alertType,
      details,
    };

    this.alerts.unshift(notification);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.pop();
    }

    console.log(`\n📢 [Amazon SNS Notification]`);
    console.log(`   Topic: WebsiteUptimeAlertsTopic`);
    console.log(`   Subject: ${notification.subject}`);
    console.log(`   Details: ${details}\n`);

    return messageId;
  }

  getAlerts() {
    return this.alerts;
  }

  getSubscribers() {
    return this.subscribers;
  }
}

module.exports = new SnsEmulator();

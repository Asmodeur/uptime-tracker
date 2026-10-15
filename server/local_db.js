/**
 * Embedded Local Database Engine (Fallback when Amazon RDS is not connected)
 * Persists data to a local JSON file in server/data/uptime_local.json.
 * Provides a SQL-compatible query() interface so all application code works identically
 * whether running against Amazon RDS PostgreSQL or locally.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'uptime_local.json');

// Initial seed data
const DEFAULT_STATE = {
  sites: [
    {
      id: 1,
      name: 'Google Search',
      url: 'https://www.google.com',
      check_interval: 30,
      timeout_ms: 5000,
      is_active: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      name: 'GitHub Portal',
      url: 'https://github.com',
      check_interval: 30,
      timeout_ms: 5000,
      is_active: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      name: 'AWS Cloud Console',
      url: 'https://aws.amazon.com',
      check_interval: 30,
      timeout_ms: 5000,
      is_active: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 4,
      name: 'VIT-AP University',
      url: 'https://vitap.ac.in',
      check_interval: 30,
      timeout_ms: 5000,
      is_active: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 5,
      name: 'Cloudflare DNS',
      url: 'https://1.1.1.1',
      check_interval: 30,
      timeout_ms: 3000,
      is_active: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  checks: [],
  alerts: [],
};

// Seed initial checks for demonstration
for (const site of DEFAULT_STATE.sites) {
  for (let i = 5; i >= 1; i--) {
    const isUp = true;
    const baseLatency = 60 + site.id * 25;
    DEFAULT_STATE.checks.push({
      id: DEFAULT_STATE.checks.length + 1,
      site_id: site.id,
      status: isUp ? 'up' : 'down',
      response_time: isUp ? baseLatency + Math.floor(Math.random() * 30) : null,
      http_status_code: 200,
      error_message: null,
      checked_at: new Date(Date.now() - i * 60000).toISOString(),
    });
  }
}

class LocalDatabase {
  constructor() {
    this.ensureDataFile();
    this.load();
  }

  ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
    }
  }

  load() {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      this.state = JSON.parse(content);
    } catch (e) {
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save local database state:', e.message);
    }
  }

  async query(sql, params = []) {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    // SELECT * FROM sites
    if (upper.startsWith('SELECT * FROM SITES WHERE IS_ACTIVE = TRUE')) {
      const rows = this.state.sites.filter((s) => s.is_active !== false);
      return { rows, rowCount: rows.length };
    }

    if (upper.startsWith('SELECT * FROM SITES')) {
      const rows = [...this.state.sites];
      return { rows, rowCount: rows.length };
    }

    // Comprehensive SELECT with stats
    if (upper.startsWith('SELECT') && upper.includes('FROM SITES S') && upper.includes('COUNT(C.ID)')) {
      const rows = this.state.sites.map((site) => {
        const siteChecks = this.state.checks.filter((c) => c.site_id === site.id);
        const upChecks = siteChecks.filter((c) => c.status === 'up');
        const total = siteChecks.length;
        const uptime = total > 0 ? parseFloat(((upChecks.length / total) * 100).toFixed(1)) : null;
        const latencies = upChecks.map((c) => c.response_time).filter((t) => typeof t === 'number');
        const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
        return {
          id: site.id,
          name: site.name,
          url: site.url,
          check_interval: site.check_interval || 30,
          is_active: site.is_active !== false,
          created_at: site.created_at,
          total_checks: total,
          up_checks: upChecks.length,
          uptime_percentage: uptime,
          avg_response_time: avgLatency,
        };
      });
      return { rows, rowCount: rows.length };
    }

    // SELECT latest check for site
    if (upper.includes('FROM CHECKS WHERE SITE_ID = $1 ORDER BY CHECKED_AT DESC LIMIT 1')) {
      const siteId = parseInt(params[0], 10);
      const siteChecks = this.state.checks
        .filter((c) => c.site_id === siteId)
        .sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at));
      const latest = siteChecks[0];
      return { rows: latest ? [latest] : [], rowCount: latest ? 1 : 0 };
    }

    // SELECT status FROM checks WHERE site_id = $1
    if (upper.includes('FROM CHECKS WHERE SITE_ID = $1')) {
      const siteId = parseInt(params[0], 10);
      let siteChecks = this.state.checks.filter((c) => c.site_id === siteId);
      if (upper.includes('ORDER BY CHECKED_AT DESC')) {
        siteChecks.sort((a, b) => new Date(b.checked_at) - new Date(a.checked_at));
      }
      const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        siteChecks = siteChecks.slice(0, parseInt(limitMatch[1], 10));
      }
      return { rows: siteChecks, rowCount: siteChecks.length };
    }

    // INSERT INTO sites
    if (upper.startsWith('INSERT INTO SITES')) {
      const nextId = this.state.sites.length > 0 ? Math.max(...this.state.sites.map((s) => s.id)) + 1 : 1;
      const newSite = {
        id: nextId,
        name: params[0],
        url: params[1],
        check_interval: params[2] || 30,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      this.state.sites.push(newSite);
      this.save();
      return { rows: [newSite], rowCount: 1 };
    }

    // DELETE FROM sites
    if (upper.startsWith('DELETE FROM SITES WHERE ID = $1')) {
      const id = parseInt(params[0], 10);
      const prevLen = this.state.sites.length;
      this.state.sites = this.state.sites.filter((s) => s.id !== id);
      this.state.checks = this.state.checks.filter((c) => c.site_id !== id);
      this.state.alerts = this.state.alerts.filter((a) => a.site_id !== id);
      this.save();
      return { rowCount: prevLen - this.state.sites.length };
    }

    // INSERT INTO checks
    if (upper.startsWith('INSERT INTO CHECKS')) {
      const nextId = this.state.checks.length > 0 ? Math.max(...this.state.checks.map((c) => c.id)) + 1 : 1;
      const newCheck = {
        id: nextId,
        site_id: parseInt(params[0], 10),
        status: params[1],
        response_time: params[2],
        http_status_code: params[3],
        error_message: params[4],
        checked_at: new Date().toISOString(),
      };
      this.state.checks.push(newCheck);
      // Keep recent 500 checks
      if (this.state.checks.length > 500) {
        this.state.checks = this.state.checks.slice(-500);
      }
      this.save();
      return { rows: [newCheck], rowCount: 1 };
    }

    // INSERT INTO alerts
    if (upper.startsWith('INSERT INTO ALERTS')) {
      const nextId = this.state.alerts.length > 0 ? Math.max(...this.state.alerts.map((a) => a.id)) + 1 : 1;
      const newAlert = {
        id: nextId,
        site_id: parseInt(params[0], 10),
        alert_type: params[1] || 'DOWNTIME',
        status_changed_to: params[2] || 'down',
        message: params[3],
        sns_message_id: params[4] || `MOCK-SNS-${Date.now()}`,
        sent_at: new Date().toISOString(),
      };
      this.state.alerts.push(newAlert);
      this.save();
      return { rows: [newAlert], rowCount: 1 };
    }

    // Platform stats
    if (upper.includes('FROM SITES S') && upper.includes('GLOBAL_UPTIME_PERCENTAGE')) {
      const totalChecks = this.state.checks.length;
      const upChecks = this.state.checks.filter((c) => c.status === 'up').length;
      const uptime = totalChecks > 0 ? parseFloat(((upChecks / totalChecks) * 100).toFixed(2)) : 100.0;
      return {
        rows: [
          {
            total_monitored_sites: this.state.sites.length,
            total_checks_logged: totalChecks,
            total_alerts_dispatched: this.state.alerts.length,
            global_uptime_percentage: uptime,
          },
        ],
        rowCount: 1,
      };
    }

    return { rows: [], rowCount: 0 };
  }
}

module.exports = new LocalDatabase();

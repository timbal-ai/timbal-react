export type Severity = "critical" | "high" | "medium" | "low";
export type EventStatus = "open" | "acknowledged" | "resolved";

export interface SecurityEvent {
  id: string;
  /** Epoch ms. */
  time: number;
  severity: Severity;
  source: string;
  rule: string;
  ruleId: string;
  host: string;
  user: string;
  message: string;
  status: EventStatus;
  raw: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  severity: Severity;
  source: string;
  hits24h: number;
  trend: number[];
  enabled: boolean;
}

export interface SourceHealth {
  id: string;
  name: string;
  status: "online" | "busy" | "offline";
  epm: number;
}

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-GB", { hour12: false });
}

export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* Deterministic PRNG so the console renders the same data every load  */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RULE_DEFS: Array<{
  ruleId: string;
  name: string;
  severity: Severity;
  message: string;
}> = [
  {
    ruleId: "R-0007",
    name: "Privilege escalation",
    severity: "critical",
    message: "Process spawned with elevated token outside change window.",
  },
  {
    ruleId: "R-3315",
    name: "Anomalous data egress",
    severity: "critical",
    message: "Outbound transfer volume 14x above the source baseline.",
  },
  {
    ruleId: "R-1042",
    name: "Impossible travel",
    severity: "high",
    message: "Same credential used from two locations 4,100 km apart in 18 minutes.",
  },
  {
    ruleId: "R-1188",
    name: "Suspicious PowerShell",
    severity: "high",
    message: "Encoded PowerShell command matching known download-cradle pattern.",
  },
  {
    ruleId: "R-0930",
    name: "Malware signature match",
    severity: "high",
    message: "File hash matched a known malware family on write.",
  },
  {
    ruleId: "R-2210",
    name: "Brute-force login",
    severity: "medium",
    message: "23 failed logins for one account within 60 seconds.",
  },
  {
    ruleId: "R-2764",
    name: "MFA disabled",
    severity: "medium",
    message: "Multi-factor requirement removed from an active account.",
  },
  {
    ruleId: "R-4001",
    name: "Port scan detected",
    severity: "low",
    message: "Sequential connection attempts across 40+ closed ports.",
  },
];

const SOURCES = [
  "auth-gateway",
  "edge-fw-02",
  "okta",
  "aws-cloudtrail",
  "crowdstrike",
  "k8s-audit",
];

const HOSTS = [
  "ip-10-2-14-8",
  "web-prod-03",
  "db-primary-01",
  "vpn-edge-1",
  "build-runner-7",
  "mac-ldn-224",
];

const USERS = [
  "m.alvarez",
  "j.chen",
  "svc-backup",
  "root",
  "a.osei",
  "d.laurent",
  "svc-ci",
];

function buildRaw(event: {
  time: number;
  source: string;
  ruleId: string;
  host: string;
  user: string;
}): string {
  return JSON.stringify(
    {
      ts: new Date(event.time).toISOString(),
      src: event.source,
      rule_id: event.ruleId,
      host: event.host,
      principal: event.user,
      action: "flagged",
      session: `s-${event.time.toString(36)}`,
    },
    null,
    2,
  );
}

function makeEvent(seq: number, time: number, rand: () => number): SecurityEvent {
  const def = RULE_DEFS[Math.floor(rand() * RULE_DEFS.length)];
  const source = SOURCES[Math.floor(rand() * SOURCES.length)];
  const host = HOSTS[Math.floor(rand() * HOSTS.length)];
  const user = USERS[Math.floor(rand() * USERS.length)];
  const base = { time, source, ruleId: def.ruleId, host, user };
  return {
    id: `EVT-${(18200 + seq).toString()}`,
    time,
    severity: def.severity,
    source,
    rule: def.name,
    ruleId: def.ruleId,
    host,
    user,
    message: def.message,
    status: "open",
    raw: buildRaw(base),
  };
}

const seedRand = mulberry32(0x51e9);
const NOW = Date.now();

export const seedEvents: SecurityEvent[] = (() => {
  const events: SecurityEvent[] = [];
  let t = NOW;
  for (let i = 0; i < 32; i += 1) {
    t -= 15_000 + Math.floor(seedRand() * 75_000);
    events.push(makeEvent(32 - i, t, seedRand));
  }
  return events;
})();

let liveSeq = 33;
export function createLiveEvent(): SecurityEvent {
  liveSeq += 1;
  return makeEvent(liveSeq, Date.now(), Math.random);
}

/* ------------------------------------------------------------------ */
/* Overview datasets                                                   */
/* ------------------------------------------------------------------ */

const epmRand = mulberry32(0xa11ce);

/** Events per minute, last 60 minutes. */
export const eventsPerMinute = Array.from({ length: 60 }, (_, i) => {
  const minutesAgo = 59 - i;
  return {
    t: formatClock(NOW - minutesAgo * 60_000),
    events: Math.round(118 + 46 * Math.sin(i / 6.5) + epmRand() * 38),
  };
});

/** Trailing slice reused as the KPI sparkline. */
export const epmSparkline = eventsPerMinute.slice(-20).map((p) => p.events);

export const currentEpm = eventsPerMinute[eventsPerMinute.length - 1].events;

/** Severity split, last 24 hours — order matches SEVERITY_SLICE_COLORS. */
export const severitySplit = [
  { severity: "Critical", count: 42 },
  { severity: "High", count: 187 },
  { severity: "Medium", count: 486 },
  { severity: "Low", count: 569 },
];

export const severityTotal = severitySplit.reduce((sum, s) => sum + s.count, 0);

/** Top rules by event volume, last 24 hours. */
export const topRules = [
  { rule: "Brute-force login", count: 214 },
  { rule: "Port scan detected", count: 186 },
  { rule: "Impossible travel", count: 142 },
  { rule: "Suspicious PowerShell", count: 118 },
  { rule: "MFA disabled", count: 74 },
  { rule: "Privilege escalation", count: 39 },
];

export const sourceHealth: SourceHealth[] = [
  { id: "auth-gateway", name: "auth-gateway", status: "online", epm: 38 },
  { id: "edge-fw-02", name: "edge-fw-02", status: "busy", epm: 51 },
  { id: "okta", name: "okta", status: "online", epm: 12 },
  { id: "aws-cloudtrail", name: "aws-cloudtrail", status: "online", epm: 29 },
  { id: "crowdstrike", name: "crowdstrike", status: "online", epm: 17 },
  { id: "legacy-syslog", name: "legacy-syslog", status: "offline", epm: 0 },
];

/* ------------------------------------------------------------------ */
/* Rules workspace                                                     */
/* ------------------------------------------------------------------ */

const ruleRand = mulberry32(0xbead);

function trendSeries(peak: number): number[] {
  return Array.from({ length: 12 }, () => Math.round(peak * (0.3 + ruleRand() * 0.7)));
}

export const detectionRules: DetectionRule[] = [
  { id: "R-2210", name: "Brute-force login", severity: "medium", source: "auth-gateway", hits24h: 214, trend: trendSeries(24), enabled: true },
  { id: "R-4001", name: "Port scan detected", severity: "low", source: "edge-fw-02", hits24h: 186, trend: trendSeries(21), enabled: true },
  { id: "R-1042", name: "Impossible travel", severity: "high", source: "okta", hits24h: 142, trend: trendSeries(17), enabled: true },
  { id: "R-1188", name: "Suspicious PowerShell", severity: "high", source: "crowdstrike", hits24h: 118, trend: trendSeries(15), enabled: true },
  { id: "R-2764", name: "MFA disabled", severity: "medium", source: "okta", hits24h: 74, trend: trendSeries(10), enabled: true },
  { id: "R-0007", name: "Privilege escalation", severity: "critical", source: "k8s-audit", hits24h: 39, trend: trendSeries(7), enabled: true },
  { id: "R-3315", name: "Anomalous data egress", severity: "critical", source: "aws-cloudtrail", hits24h: 28, trend: trendSeries(6), enabled: true },
  { id: "R-0930", name: "Malware signature match", severity: "high", source: "crowdstrike", hits24h: 22, trend: trendSeries(5), enabled: true },
  { id: "R-5120", name: "Dormant account activity", severity: "medium", source: "okta", hits24h: 16, trend: trendSeries(4), enabled: true },
  { id: "R-6203", name: "S3 bucket policy change", severity: "high", source: "aws-cloudtrail", hits24h: 11, trend: trendSeries(3), enabled: true },
  { id: "R-7714", name: "TOR exit node traffic", severity: "low", source: "edge-fw-02", hits24h: 9, trend: trendSeries(3), enabled: false },
  { id: "R-8830", name: "Debug logging enabled", severity: "low", source: "k8s-audit", hits24h: 2, trend: trendSeries(2), enabled: false },
];

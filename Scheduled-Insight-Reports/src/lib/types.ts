
// Shared fields common to all reports
interface BaseReportConfig {
    metrics: string[];
    dateRangeEnum: 'LAST_7_DAYS' | 'LAST_14_DAYS' | 'LAST_30_DAYS';
    cadence: 'manual' | 'hourly' | 'every 12 hours' |'daily';
    delivery: 'email' | 'link';
    email?: string;
  }
  
// Meta Specific
export interface MetaReportConfig extends BaseReportConfig {
    platform: 'meta';
    level: 'account' | 'campaign' | 'adset' | 'ad';
}

// TikTok Specific
export interface TikTokReportConfig extends BaseReportConfig {
    platform: 'tiktok';
    level: 'AUCTION_ADVERTISER' | 'AUCTION_AD' | 'AUCTION_CAMPAIGN';
}

// The Discriminated Union
export type ReportConfigFormData = MetaReportConfig | TikTokReportConfig;

// -------------------------------
// Backend / DB version (extend with extra fields)
export interface BaseReportConfigBackend extends BaseReportConfig {
    id: number;
    createdAt: string;
    lastRunAt?: string | null;
    nextRunAt?: string | null;
    lastError?: string | null;
    lastReportId?: number | null;
  }
  
// Backend Meta / TikTok specific types
export interface MetaReportConfigBackend extends BaseReportConfigBackend {
platform: 'meta';
level: 'account' | 'campaign' | 'adset' | 'ad';
}

export interface TikTokReportConfigBackend extends BaseReportConfigBackend {
platform: 'tiktok';
level: 'AUCTION_ADVERTISER' | 'AUCTION_AD' | 'AUCTION_CAMPAIGN';
}

// Backend discriminated union
export type ReportConfigBackend = MetaReportConfigBackend | TikTokReportConfigBackend;


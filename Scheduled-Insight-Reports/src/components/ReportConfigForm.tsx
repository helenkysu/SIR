import React, { useState } from "react";
import { ReportConfigFormData, MetaReportConfig, TikTokReportConfig } from "../lib/types"

const META_METRICS = [
  "spend","impressions","clicks","ctr","cpc","reach","frequency",
  "conversions","cost_per_conversion","conversion_rate","actions","cost_per_action_type"
];
const TIKTOK_METRICS = [
  "spend","impressions","clicks","conversions","cost_per_conversion","conversion_rate","ctr",
  "cpc","reach","frequency","skan_app_install","skan_cost_per_app_install",
  "skan_purchase","skan_cost_per_purchase"
];

const META_LEVELS = ["account","campaign","adset","ad"];
const TIKTOK_LEVELS = ["AUCTION_ADVERTISER","AUCTION_AD","AUCTION_CAMPAIGN"];

const DATE_RANGE_ENUM_OPTIONS = ["last7","last14","last30"];
const CADENCE_OPTIONS = ["manual","hourly","every 12 hours","daily"];
const DELIVERY_OPTIONS = ["email","link"];


interface ReportConfigFormProps {
  fetchData: () => void; //refresh configs in UI
}

export function ReportConfigForm(props:ReportConfigFormProps ) {
  const [platform, setPlatform] = useState<"meta" | "tiktok">("meta");
  const [metrics, setMetrics] = useState<string[]>([]);
  const [level, setLevel] = useState<string>(META_LEVELS[0]);
  const [dateRangeEnum, setDateRangeEnum] = useState<string>("last7");
  const [cadence, setCadence] = useState<string>("daily");
  const [delivery, setDelivery] = useState<string>("email");
  const [email, setEmail] = useState<string>("");

  const currentMetrics = platform === "meta" ? META_METRICS : TIKTOK_METRICS;
  const currentLevels = platform === "meta" ? META_LEVELS : TIKTOK_LEVELS;

  const toggleMetric = (m: string) => {
    setMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!platform) return alert("Platform is required");
  if (metrics.length < 1) return alert("Select at least one metric");
  if (!level) return alert("Level is required");
  if (!dateRangeEnum) return alert("Date Range Enum is required");
  if (!cadence) return alert("Cadence is required");
  if (!delivery) return alert("Delivery is required");
  if (delivery === "email" && !email) return alert("Email is required");
  if (delivery === "email" && !/^\S+@\S+\.\S+$/.test(email)) return alert("Email is invalid");

  let formData: MetaReportConfig | TikTokReportConfig;

  if (platform === "meta") {
    formData = {
      platform,
      metrics,       
      level: level as MetaReportConfig["level"],
      dateRangeEnum: dateRangeEnum as MetaReportConfig["dateRangeEnum"],
      cadence: cadence as MetaReportConfig["cadence"],
      delivery: delivery as MetaReportConfig["delivery"],
      email: email || undefined,
    };
  } else {
    formData = {
      platform,
      metrics: metrics as TikTokReportConfig["metrics"],
      level: level as TikTokReportConfig["level"],
      dateRangeEnum: dateRangeEnum as TikTokReportConfig["dateRangeEnum"],
      cadence: cadence as TikTokReportConfig["cadence"],
      delivery: delivery as TikTokReportConfig["delivery"],
      email: email || undefined,
    };
  }


  try {
    const response = await fetch("/api/configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert(`${platform} report config created successfully!`);
      props.fetchData();
    } else {
      const text = await response.text();
      console.error("API error:", text);
      alert(`Failed to create ${platform} report config`);
    }
  } catch (err) {
    console.error("Request failed:", err);
    alert(`Failed to create ${platform} report config`);
  }
  };


  return (
    <form className="flex flex-col space-y-6 max-w-md p-4" onSubmit={handleSubmit}>
      {/* Platform */}
      <div className="flex flex-col space-y-2">
        <label className="font-bold">Platform</label>
        <select
          className="border p-2 rounded"
          value={platform}
          onChange={e => {
            const value = e.target.value as "meta" | "tiktok";
            setPlatform(value);
            setMetrics([]);
            setLevel(value === "meta" ? META_LEVELS[0] : TIKTOK_LEVELS[0]);
          }}
        >
          <option value="meta">Meta</option>
          <option value="tiktok">TikTok</option>
        </select>
      </div>
      
      {/* Metrics */}
      <div className="flex flex-col space-y-2">
        <label className="font-bold">Metrics (select at least one)</label>
        <div className="flex flex-wrap gap-2">
          {currentMetrics.map(m => (
            <button
              key={m}
              type="button"
              className={`px-3 py-1 rounded border ${
                metrics.includes(m) ? "bg-blue-600 text-white" : ""
              }`}
              onClick={() => toggleMetric(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className="flex flex-col space-y-2">
        <label className="font-bold">Level</label>
        <select
          className="border p-2 rounded"
          value={level}
          onChange={e => setLevel(e.target.value)}
        >
          {currentLevels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Date Range Enum */}
      <div className="flex flex-col space-y-2">
        <label className="font-bold">Date Range</label>
        <select
          className="border p-2 rounded"
          value={dateRangeEnum}
          onChange={e => setDateRangeEnum(e.target.value)}
        >
          {DATE_RANGE_ENUM_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Cadence */}
      <div className="flex flex-col space-y-2">
        <label className="font-bold">Cadence</label>
        <select
          className="border p-2 rounded"
          value={cadence}
          onChange={e => setCadence(e.target.value)}
        >
          {CADENCE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Delivery */}
      <div className="flex flex-col space-y-2">
        <label className="font-bold">Delivery</label>
        <select
          className="border p-2 rounded"
          value={delivery}
          onChange={e => setDelivery(e.target.value)}
        >
          {DELIVERY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {delivery === "email" && (
          <input
            type="email"
            placeholder="Enter email"
            className="border p-2 rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        )}
      </div>

      <button
        type="submit"
        className="bg-black text-white p-3 rounded font-bold hover:bg-gray-800 transition cursor-pointer"
      >
        Create Report
      </button>
    </form>
  );
}

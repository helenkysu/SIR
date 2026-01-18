'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportConfigForm } from '@/components/ReportConfigForm';
import { ReportConfigFormData } from '../lib/types'
import { Loader2 } from 'lucide-react';
import { ReportConfigBackend } from '../lib/types';

interface Report {
  id: number;
  config_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  platform: string;
  metrics: string[];
  level: string;
  date_range_enum: string;
  data?: any;
  llm_analysis?: string;
  error_message?: string;
  generated_at: string;
  completed_at?: string;
}

interface ReportConfig {
  id: number;
  platform: string;
  metrics: string[];
  level: string;
  date_range_enum: string;
  cadence: string;
  delivery: string;
  email?: string;
  created_at: string;
}

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [configs, setConfigs] = useState<ReportConfigBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Only one endpoint for configs
      const res = await fetch("/api/configs");
      if (!res.ok) throw new Error("Failed to fetch configs");

      const data = await res.json();

      // data already matches the DB shape: lastRunAt, nextRunAt, lastError, lastGeneratedReportId, delivery, email, etc.
      setConfigs(data);
    } catch (error) {
      console.error("Error fetching configs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (configId: number) => {
    setLoadingMap(prev => ({ ...prev, [configId]: true }));

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to generate report:', data.error);
        setConfigs(prev => prev.map(c =>
          c.id === configId ? { ...c, lastError: data.error || 'Server Error' } : c
        ));
        alert(`Failed to generate report: ${data.error}`);
        return;
      }

      if (data.reportId) {
        setConfigs(prev => prev.map(c => {
          if (c.id === configId) {
            return {
              ...c,
              lastReportId: data.reportId,
              lastError: data.lastError,
              lastRunAt: data.lastRunAt
            };
          }
          return c;
        }));
      }

      console.log(`Report generation successful for report config ${configId}:`, data);
      alert(`Report generation successful! Report ID: ${data.reportId}`);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('An error occurred while generating the report.');
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setConfigs(prev => prev.map(c =>
        c.id === configId ? { ...c, lastError: errorMessage || 'Server Error', lastRunAt: new Date().toISOString() } : c
      ));
    } finally {
      setLoadingMap(prev => ({ ...prev, [configId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Report Dashboard</h1>
        <p className="text-gray-600">Manage and view your advertising reports</p>
      </div>

      <Tabs defaultValue="reports" className="space-y-6" onValueChange={(value) => {
        if (value === "Reports") {
          //refresh to get new configs for UI
          fetchData();
        }
      }}>
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {configs.map((config) => (
              <Card key={config.id} className="mb-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {config.platform.toUpperCase()} Report - {config.level}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        Created: {new Date(config.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    {/* Metrics */}
                    <div className="flex flex-wrap gap-2">
                      {config.metrics.map((metric) => (
                        <Badge key={metric} variant="outline">{metric}</Badge>
                      ))}
                    </div>

                    {/* Run info */}
                    <p>Run Schedule: {config.cadence}</p>
                    <p>Last Run: {config.lastRunAt ? new Date(config.lastRunAt).toLocaleString() : "N/A"}</p>
                    <p>Next Scheduled Run: {config.nextRunAt ? new Date(config.nextRunAt).toLocaleString() : "N/A"}</p>
                    <p>Last Error: {config.lastError || "None"}</p>
                    {config.delivery === "email" && <p>Reports will be sent to email: {config.email || "Not set"}</p>}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => handleGenerateReport(config.id)}
                        disabled={loadingMap[config.id]}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loadingMap[config.id] ? 'Generating...' : 'Run Now'}
                      </button>

                      <button
                        onClick={() => {
                          if (!config.lastReportId) {
                            alert('No report has been generated yet.');
                            return;
                          }
                          window.open(`/api/reports/view/${config.lastReportId}`, '_blank');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        View Last Report
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          </div>
        </TabsContent>

        <TabsContent value="create">
          <ReportConfigForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
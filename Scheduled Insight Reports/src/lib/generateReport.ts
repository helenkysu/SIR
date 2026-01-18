import { dbClient , saveError} from './database'
import { emailService } from '@/lib/email';
import { calculateNextRunAt } from '../lib/utils'
export async function generateReport(reportId: number, config: any, isScheduledRun: boolean) {
    try {
      // Mark report as running
      await dbClient.execute(
        `UPDATE reports SET status = ?, runStart = CURRENT_TIMESTAMP WHERE reportId = ?`,
        ['running', reportId]
      );
  
      //Fetch platform data
      const platformData = await fetchPlatformData(config);
  
      const llmAnalysis = await analyzeWithLLM(platformData, config)
  
      // build HTML report
      const reportHTML = await buildReportHTML(platformData, llmAnalysis, config);
  
      // store report in db field
      await dbClient.execute(
        `UPDATE reports
         SET status = ?, reportContents = ?, error = ?, runEnd = CURRENT_TIMESTAMP
         WHERE reportId = ?`,
        ['completed', reportHTML, null, reportId]
      );
  
      //up date last run info
      const nowDate = new Date()
      const now = nowDate.toISOString();
      let nextRunAt: string | null = null;

      if (config.cadence !== 'manual' && isScheduledRun) {
        nextRunAt = calculateNextRunAt(nowDate, config.cadence)
        await dbClient.execute(
            `UPDATE reportconfigs
             SET lastRunAt = ?, nextRunAt = ?, lastReportId = ?
             WHERE id = ?`,
            [now, nextRunAt, reportId, config.id]
          );
      
      }

      await dbClient.execute(
        `UPDATE reportconfigs
         SET lastRunAt = ?, lastReportId = ?
         WHERE id = ?`,
        [now, reportId, config.id]
      );
  
      // send email if delivery type is set to email
      if (config.delivery === 'email' && config.email) {
        try {
          await emailService.sendReportEmail(
            config.email,
            reportHTML,
            config,
            reportId
          );
  
          await dbClient.execute(
            `UPDATE reports
             SET emailSentStatus = ?, 
                 emailAddress = ?, 
                 emailDeliveryTime = ?
             WHERE reportId = ?`,
            ['sent', config.email, now, reportId]
          );
  
          console.log(`Report ${reportId} emailed to ${config.email}`);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            console.error('Error generating report:', emailError);
            await saveError(emailError, reportId, config.id)
            return false
        }
      }
      return true
  
    } catch (error) {
      console.error('Error generating report:', error);
      await saveError(error, reportId, config.id)
      return false
    }
  }
  
  // helper for building formatted report
  async function buildReportHTML(platformData: any, llmAnalysis: string, config: any) {
    const metricsList = JSON.parse(config.metrics)
      .map((m: string) => `<li>${m}</li>`)
      .join('');
  
    const platformDataHTML = await generateSimpleRowChartHTML(platformData.data)

    const llmAnalysisHTML = `<div style="background:#f0f4f8;padding:10px;border-radius:6px;margin-top:10px;">
      <h3 style="margin-top:0;"> Analysis</h3>
      <p style="white-space:pre-wrap;">${llmAnalysis}</p>
    </div>`;
  
    return `
      <html>
        <body style="font-family:Arial, sans-serif; line-height:1.5; padding-left:50px">
          <h2>${config.platform.toUpperCase()} Report - ${config.level}</h2>
          <p><strong>Metrics:</strong></p>
          <ul>${metricsList}</ul>
          <p><strong>Date Range:</strong> ${config.dateRangeEnum}</p>
          <p><strong>Report Generated At:</strong> ${new Date().toLocaleString()}</p>
          ${llmAnalysisHTML}
          <h3>Platform Data</h3>
          ${platformDataHTML}
          
        </body>
      </html>
    `;
  }
  
  // helper to get platform data
  async function fetchPlatformData(config: any) {
    const endpoint = config.platform === 'meta'
      ? 'https://bizdev.newform.ai/sample-data/meta'
      : 'https://bizdev.newform.ai/sample-data/tiktok';
  
    const requestBody: any = {
      metrics: JSON.parse(config.metrics),
      level: config.level,
      dateRangeEnum: config.dateRangeEnum,
    };
  
    if (config.platform === 'meta') {
      // setting meta fields not required in form
      requestBody.breakdowns = ["age"];       
      requestBody.timeIncrement = 'all_days';     
    }

    if (config.platform === 'tiktok') {
        // setting tiktok fields not required in form
        requestBody.dimensions = [
            "ad_id"
        ];      
  
      }
    console.log("request body is: ")
    console.log(requestBody)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'NEWFORMCODINGCHALLENGE', // Added token
      },
      body: JSON.stringify(requestBody)
    });
  
    if (!response.ok) {
      const errorData = await response.json(); // Catch the actual API error message
      console.error("API Error Detail:", errorData);
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const apiResults = await response.json();
    console.log("api Results are")
    console.log(apiResults)
    if (config.platform === 'meta') {
        return apiResults
    }
    else{
        const flattenedResults = flattenTikTokData(apiResults.data)
        console.log("flattened results are: ")
        console.log(flattenedResults)
        return { data: flattenedResults };
    }
    
  }
  
  function flattenTikTokData(tiktokRows: any[]) {
    return tiktokRows.map(row => ({
      ...row.dimensions,
      ...row.metrics
    }));
  }
 
  // Call google gemini LLM to analyze platform data
   async function analyzeWithLLM(data: any, config: any) {
    const prompt = `Analyze this ${config.platform} advertising data and provide insights:
    
    Platform: ${config.platform}
    Metrics: ${config.metrics}
    Level: ${config.level}
    Date Range: ${config.dateRangeEnum}
  
    Data: ${JSON.stringify(data, null, 2)}
  
    Please provide:
    1. Key performance highlights
    2. Areas of concern
    3. Recommendations for optimization
    4. Notable trends or patterns
    
    CRITICAL INSTRUCTIONS:
    - DO NOT provide an introduction, preamble, or conversational filler.
    - DO NOT say "Here is the analysis" or "Okay, let's look at the data."
    - Start immediately with the first heading (e.g., "1. Key Performance Highlights").
    - Provide raw, direct analysis only.
    `;
  
    // google gemini v1beta endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`;
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }
  
      const result = await response.json();
      
      // Gemini returns text inside candidates[0].content.parts[0].text
      return result.candidates[0].content.parts[0].text;
  
    } catch (err) {
      console.error('Gemini analysis failed:', err);
      throw new Error('Analysis temporarily unavailable. Please check API key and rate limits.');
    }
  }
  

  export async function generateSimpleRowChartHTML(data: any[]) {
    if (!data || !data.length) return "<p style='color: #666;'>No data available</p>";
  
    // 1. Get headers from the keys of the first object
    const headers = Object.keys(data[0]);
  
    // 2. Build the Table Header
    const headerHTML = headers
      .map(header => `
        <th style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: bold; text-transform: capitalize;">
          ${header.replace(/([A-Z])/g, ' $1')}
        </th>`)
      .join('');
  
    // 3. Build the Table Rows
    const rowsHTML = data.map((row, index) => {
      const cells = headers.map(header => {
        let value = row[header];
        
        // Format numbers to be more readable
        if (typeof value === 'number') {
          value = value.toLocaleString(undefined, { maximumFractionDigits: 2 });
        }
        // Handle nulls/undefined
        if (value === null || value === undefined) value = '-';
  
        return `<td style="border: 1px solid #dee2e6; padding: 10px;">${value}</td>`;
      }).join('');
  
      const rowBg = index % 2 === 0 ? '#ffffff' : '#fcfcfc';
      return `<tr style="background-color: ${rowBg};">${cells}</tr>`;
    }).join('');
  
    // 4. Return the full HTML structure
    return `
      <div style="overflow-x: auto; margin: 20px 0; font-family: sans-serif;">
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; font-size: 14px; color: #333;">
          <thead>
            <tr>${headerHTML}</tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    `;
  }
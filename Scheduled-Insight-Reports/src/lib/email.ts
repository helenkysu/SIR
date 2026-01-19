import { Resend } from 'resend';
import puppeteer from 'puppeteer-core';
const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendReportEmail(toEmail: string, htmlContent: string, config: any, reportId: number) {
    // 1. Connect to Browserless.io
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_KEY}`
    });

    try {
      const page = await browser.newPage();

      await page.setContent(
        `
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                padding: 40px;
                line-height: 1.6;
              }
              .footer { margin-top: 50px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
          </head>
          <body>
            ${htmlContent}
            <div class="footer">
              <p>Report ID: ${reportId} | Generated for ${toEmail}</p>
            </div>
          </body>
        </html>
        `,
        { waitUntil: "networkidle0" }
      );


      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });

 
      return await resend.emails.send({
        from: 'Reports <onboarding@resend.dev>',
        to: toEmail,
        subject: `${config.platform.toUpperCase()} Scheduled Insight Report #${reportId}`,
        html: `
          <h3>Your ${config.platform} Report is ready</h3>
          <p>Please find the attached PDF report for <strong>#${reportId}</strong>.</p>
          <p>This report was automatically generated based on your ${config.cadence} schedule.</p>
        `,
        attachments: [
          {
            filename: `${config.platform}_Report_${reportId}.pdf`,
            content: Buffer.from(pdfBuffer), 
          },
        ],
      });

    } catch (error) {
      console.error("Email/PDF Service Error:", error);
      throw error;
    } finally {
      await browser.close();
    }
  }
};
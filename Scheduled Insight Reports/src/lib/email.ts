import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendReportEmail(toEmail: string, htmlContent: string, config: any, reportId: number) {
    return await resend.emails.send({
      from: 'Reports <onboarding@resend.dev>', 
      to: toEmail,
      subject: `${config.platform.toUpperCase()} Scheduled Insight Report #${reportId}`,
      html: htmlContent,
    });
  }
};
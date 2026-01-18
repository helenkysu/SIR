# Report Dashboard

A comprehensive Next.js dashboard for creating, managing, and viewing advertising reports from Meta and TikTok platforms with AI-powered analysis.

## Features

- **Platform Support**: Meta and TikTok advertising data
- **Configurable Reports**: Custom metrics, levels, and date ranges
- **AI Analysis**: GPT-4 powered insights and recommendations
- **Scheduled Reports**: Automated report generation with node-cron
- **Email Delivery**: ZeptoMail integration for report distribution
- **Public Access**: Shareable report links
- **Interactive Dashboard**: Real-time status updates and data visualization
- **Data Persistence**: SQLite database for configurations and reports

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Database**: SQLite
- **Scheduler**: node-cron
- **Email**: ZeptoMail via Nodemailer
- **LLM**: OpenAI GPT-4

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd report-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key
ZEPTO_USER=your_zepto_username
ZEPTO_PASS=your_zepto_password
```

4. Initialize the database:
```bash
npm run dev
```
The database will be automatically initialized on first run.

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Report Configurations
- `GET /api/configs` - List all configurations
- `POST /api/configs` - Create new configuration

### Reports
- `GET /api/reports` - List all reports
- `GET /api/reports/[id]` - Get specific report
- `POST /api/reports/generate` - Generate new report

### Scheduling
- `POST /api/schedule` - Schedule automated report
- `DELETE /api/schedule?config_id=X` - Cancel scheduled report

## Report Configuration

### Platform Options
- **Meta**: Account, Campaign, Ad Set, Ad levels
- **TikTok**: Advertiser, Ad, Campaign levels

### Available Metrics
**Meta**: spend, impressions, clicks, ctr, cpc, reach, frequency, conversions, cost_per_conversion, conversion_rate, actions, cost_per_action_type

**TikTok**: spend, impressions, clicks, conversions, cost_per_conversion, conversion_rate, ctr, cpc, reach, frequency, skan_app_install, skan_cost_per_app_install, skan_purchase, skan_cost_per_purchase

### Date Ranges
- last7, last14, last30

### Cadence Options
- Manual, Hourly, Every 12 hours, Daily

### Delivery Methods
- Email (via ZeptoMail)
- Public link

## Database Schema

### report_configs
- id, platform, metrics, level, date_range_enum, cadence, delivery, email, created_at, updated_at

### reports
- id, config_id, status, data, llm_analysis, error_message, generated_at, completed_at

### scheduled_reports
- id, config_id, next_run_at, is_active, created_at

## Public Report Access

Reports are accessible via public URLs:
```
https://your-domain.com/public/reports/[report-id]
```

These pages show:
- Report overview and status
- Interactive data visualization
- AI analysis and insights
- Download and sharing options

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Environment Variables for Production
- `OPENAI_API_KEY` - Required for AI analysis
- `ZEPTO_USER` & `ZEPTO_PASS` - Required for email delivery
- `NEXT_PUBLIC_BASE_URL` - Your production domain

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

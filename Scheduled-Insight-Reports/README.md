# Report Dashboard

A comprehensive Next.js dashboard for creating, managing, and viewing advertising reports from Meta and TikTok platforms with AI-powered analysis.

## Features

- **Platform Support**: Meta and TikTok advertising data
- **Configurable Reports**: Custom metrics, levels, and date ranges
- **AI Analysis**: Gemini 2.0 Flash powered insights and recommendations
- **Scheduled Reports**: Automated report generation with cron-job
- **Email Delivery**: Resend integration for report distribution
- **Public Access**: Shareable report links
- **Data Persistence**: Turso database for configurations and reports

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Scheduled-Insight-Reports
```

2. Install dependencies:
```bash
npm install
```


3. Edit `.env` with your API keys:
```env
# Report Dashboard Environment Variables

GOOGLE_GEMINI_API_KEY=samplekey
RESEND_API_KEY=samplekey
TURSO_ENDPOINT=sampleendpoint
TURSO_TOKEN=sampletoken
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
- `GET /api/reports/generate` - Creates a new report
- `GET /api/reports/view/[id]` - Displays a specific report

### Scheduling
- `POST /api/cron` - cron endpoint used by cron-job.org


# ASC 606 Analyzer Web App - Deployment Guide

This is a Next.js web application that allows users to upload contracts and run ASC 606 financing component calculations using Python backend.

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Python serverless functions (Vercel)
- **Calculations**: Existing `asc606_analyzer_production.py` module

## Project Structure

```
webapp/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Main page with upload form
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── api/                         # Python API endpoints
│   └── analyze.py               # Contract analysis endpoint
├── asc606_analyzer_production.py # Core calculation module
├── package.json                 # Node dependencies
├── requirements.txt             # Python dependencies
├── vercel.json                  # Vercel configuration
└── next.config.js              # Next.js configuration
```

## Local Development

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+

### Setup

1. Install Node dependencies:
```bash
npm install
# or
yarn install
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deploying to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "Add New Project"

4. Import your Git repository

5. Vercel will automatically detect:
   - Next.js framework
   - Python serverless functions in `/api`
   - Dependencies from `package.json` and `requirements.txt`

6. Click "Deploy"

### Option 3: Deploy via GitHub Integration

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. Connect your GitHub repo to Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Vercel will auto-configure everything
   - Click "Deploy"

## Environment Variables

No environment variables are required for basic functionality. If you want to add authentication or other features, you can add them in the Vercel dashboard under Project Settings > Environment Variables.

## Features

- ✅ Upload contract data via JSON
- ✅ Real-time ASC 606 calculations
- ✅ Present value analysis
- ✅ Revenue allocation (License/Support)
- ✅ Financing component detection
- ✅ Download Excel workpapers
- ✅ Download CSV journal entries
- ✅ Mobile responsive design
- ✅ Example contract loader

## API Endpoint

### POST /api/analyze

**Request Body:**
```json
{
  "contract_data": {
    "customer": "Company Name",
    "cash_received": 1500000,
    "payment_date": "2026-01-15",
    "periods": [
      {
        "start": "2026-01-15",
        "end": "2027-01-14",
        "stated_amount": 300000
      }
    ]
  },
  "discount_rate": 0.06,
  "license_pct": 0.20
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "stated_total": 1500000,
    "present_value": 1267500,
    "financing_component": 232500,
    "financing_percentage": 0.155,
    "is_significant": true,
    ...
  },
  "excel_file": "base64_encoded_excel",
  "csv_file": "base64_encoded_csv"
}
```

## Troubleshooting

### Python import errors
- Ensure `requirements.txt` includes all necessary packages
- Vercel uses Python 3.9 runtime
- The `asc606_analyzer_production.py` file must be in the root directory

### Build failures
- Check that all Node dependencies are in `package.json`
- Verify TypeScript has no errors: `npm run build`

### API timeout
- Vercel serverless functions have a 10-second timeout on Hobby plan
- For large contracts, consider upgrading to Pro plan (60s timeout)

## Performance

- Frontend loads in ~1-2 seconds
- Python calculations typically complete in 1-3 seconds
- Excel generation adds ~500ms
- Total analysis time: 2-5 seconds for typical contracts

## Security Notes

- All calculations happen server-side
- No contract data is stored permanently
- Files are generated in memory and sent to browser
- Consider adding authentication for production use

## Future Enhancements

- [ ] File upload (CSV/Excel) instead of JSON only
- [ ] Contract history/saved analyses
- [ ] Batch processing
- [ ] PDF report generation
- [ ] Email delivery of reports
- [ ] User authentication
- [ ] Database storage

## Support

For issues with the ASC 606 calculations, refer to the main README.md in the root directory.

For deployment issues, check [Vercel documentation](https://vercel.com/docs).

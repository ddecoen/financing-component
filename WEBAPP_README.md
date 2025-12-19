# ASC 606 Analyzer - Web Application

A modern web interface for analyzing multi-year SaaS contracts with up-front payments under ASC 606.

## 🚀 Quick Start

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/asc606-analyzer)

**Or manually:**

1. Push this directory to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Click Deploy (no configuration needed!)

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📋 Features

- **Upload Contract Data**: Paste JSON contract details
- **Real-time Analysis**: Get instant ASC 606 calculations
- **Visual Results**: See financing component breakdown
- **Export Options**: Download Excel workpapers and CSV journal entries
- **Example Data**: Load sample contract to test

## 🎯 How It Works

1. **Enter Contract Details** - Use JSON format or load example
2. **Configure Parameters** - Set discount rate and license allocation %
3. **Analyze** - Click button to run calculations
4. **Review Results** - See present value, financing component, revenue allocation
5. **Export** - Download Excel or CSV files for your records

## 📊 What Gets Calculated

- **Present Value Analysis**: Discount future payments to today's value
- **Financing Component**: Calculate implicit financing in the contract
- **Revenue Allocation**: Split between License and Support
- **Journal Entries**: Generate accounting entries with effective interest method
- **Significance Test**: Determine if financing component exceeds 5% threshold

## 🔧 Technology

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Python serverless functions
- **Calculations**: Production ASC 606 analyzer module
- **Hosting**: Vercel (optimized for serverless)

## 📖 Contract JSON Format

```json
{
  "customer": "Acme Corp",
  "cash_received": 1500000,
  "payment_date": "2026-01-15",
  "periods": [
    {
      "start": "2026-01-15",
      "end": "2027-01-14",
      "stated_amount": 300000
    },
    {
      "start": "2027-01-15",
      "end": "2028-01-14",
      "stated_amount": 300000
    }
    // ... more periods
  ]
}
```

## 🎨 Screenshots

The app provides:
- Clean, modern interface
- Split-screen layout (input | results)
- Mobile responsive design
- Clear visual hierarchy
- Color-coded results

## 💡 Use Cases

Perfect for:
- Finance teams analyzing customer contracts
- Controllers preparing ASC 606 documentation
- Auditors reviewing revenue recognition
- Sales ops validating contract structures
- FP&A modeling contract economics

## 🔒 Security & Privacy

- All calculations run server-side
- No data is stored or logged
- Files generated in memory only
- Secure HTTPS on Vercel
- No authentication required (add if needed)

## 📚 Documentation

- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guide
- See root [README.md](../README.md) for calculation methodology
- Python module docs in [asc606_analyzer_production.py](asc606_analyzer_production.py)

## 🐛 Troubleshooting

**Build errors?**
- Run `npm run build` locally to check for TypeScript errors
- Ensure all dependencies are in package.json

**Python errors?**
- Check requirements.txt includes pandas and openpyxl
- Verify asc606_analyzer_production.py is in root directory

**Timeout errors?**
- Vercel free tier has 10s timeout
- Upgrade to Pro for 60s timeout if needed

## 🤝 Contributing

Want to improve the webapp?
- Add file upload feature
- Implement user authentication
- Add contract history/database
- Create PDF export option
- Add data visualization charts

## 📄 License

Same as parent project.

---

**Made with ❤️ by Coder Technologies Inc. - Finance Team**

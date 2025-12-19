# ⚡ Quick Start Guide

## 🚀 Get Running in 3 Minutes

### Step 1: Install Dependencies (30 seconds)
```bash
npm install
```

### Step 2: Start Development Server (10 seconds)
```bash
npm run dev
```

### Step 3: Open in Browser (5 seconds)
Visit: **http://localhost:3000**

---

## 🎯 Test the App

1. Click **"Load Example Contract"** button
2. Click **"Analyze Contract"** button
3. See results appear on the right
4. Click **"📊 Download Excel Report"**
5. Click **"📝 Download Journal Entries CSV"**

✅ **It works!**

---

## 🌐 Deploy to Vercel (2 Minutes)

### Option A: One Command
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option B: GitHub Integration
1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Click "Deploy" (no configuration needed!)
5. Get your live URL: `https://your-app.vercel.app`

---

## 📝 Use Your Own Contract Data

Replace the example with your contract JSON:

```json
{
  "customer": "Your Customer Name",
  "cash_received": 2100000,
  "payment_date": "2025-12-31",
  "periods": [
    {
      "start": "2025-12-31",
      "end": "2026-12-30",
      "stated_amount": 420000
    },
    {
      "start": "2026-12-31",
      "end": "2027-12-30",
      "stated_amount": 420000
    }
    // Add all your periods...
  ]
}
```

---

## 🔧 Customize Parameters

- **Discount Rate**: Default 6% (0.06)
- **License %**: Default 20% (0.20)

Adjust based on your company's:
- Incremental borrowing rate
- License vs Support allocation policy

---

## 📊 What You Get

### Instant Results:
- ✅ Present Value calculation
- ✅ Financing component amount
- ✅ Significance determination (>5%)
- ✅ License revenue allocation
- ✅ Support revenue allocation

### Download Files:
- 📊 **Excel Workpaper** with 5 tabs:
  - Summary
  - PV Analysis
  - License Schedule
  - Support Schedule
  - Journal Entries

- 📝 **CSV File** ready for:
  - NetSuite import
  - Other accounting systems

---

## 🆘 Troubleshooting

### "npm install" fails?
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules
npm install
```

### Port 3000 already in use?
```bash
# Use different port
npm run dev -- -p 3001
```

### Python errors in Vercel?
- Make sure `requirements.txt` is in root
- Ensure `asc606_analyzer_production.py` is in root
- Check Python version is 3.9 in `vercel.json`

---

## 📚 More Information

- **Full Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Architecture Details**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Project Summary**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Web App Overview**: See [WEBAPP_README.md](WEBAPP_README.md)
- **Calculation Details**: See [README.md](README.md)

---

## 🎉 You're Ready!

Your ASC 606 analyzer web app is fully functional and ready to deploy!

**Questions?** Check the docs above or Vercel's excellent documentation.

**Ready to deploy?** Just run: `vercel --prod`

---

**Built by Coder Technologies Inc. - Finance Team**

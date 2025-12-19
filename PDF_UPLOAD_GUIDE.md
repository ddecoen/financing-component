# 📄 PDF Contract Upload Feature

## Overview

Your ASC 606 Analyzer now supports **automatic contract extraction from PDF files** using AI!

## ✨ What It Does

1. **Upload PDF** - Simply click the upload button and select a contract PDF
2. **AI Extraction** - OpenAI GPT-4 analyzes the PDF and extracts:
   - Customer/Client name
   - Total cash received (upfront payment)
   - Payment date
   - All contract periods (start dates, end dates, amounts)
3. **Auto-Fill** - Extracted data automatically populates the JSON textarea
4. **Review & Edit** - You can review and adjust the data before analysis
5. **Analyze** - Click "Analyze Contract" to run calculations

## 🚀 How to Use

### Step 1: Upload PDF
1. Click the **"📄 Upload PDF Contract"** button
2. Select your contract PDF file
3. Wait while AI processes it (usually 3-10 seconds)

### Step 2: Review Extracted Data
- The JSON textarea will be populated with extracted contract details
- Review all fields for accuracy
- Edit any incorrect values directly in the JSON

### Step 3: Analyze
- Adjust discount rate and license % if needed
- Click "Analyze Contract"
- View results!

## ⚙️ Setup (Required for PDF Feature)

To enable PDF upload, you need to add your OpenAI API key to Vercel:

### Get an OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-...`)

### Add to Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI key (paste it)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. Redeploy your app (or wait for next deployment)

## 💰 Cost

OpenAI charges per API call:
- **Model Used**: GPT-4o-mini (most cost-effective)
- **Cost per PDF**: ~$0.001-0.005 (less than a penny)
- **Monthly for typical use**: $1-5

OpenAI provides $5 free credit for new accounts!

## 🛡️ Fallback Mode

**Without API Key:**
- PDF upload button still appears
- Upload will show an error message
- You can still use manual JSON entry
- All other features work normally

**With API Key:**
- PDF upload works seamlessly
- AI extracts contract details
- Major time-saver!

## 📋 What Gets Extracted

The AI looks for and extracts:

```json
{
  "customer": "Company/Client Name",
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

## 🎯 Tips for Best Results

1. **Clear Contracts**: PDFs with clear text work best
2. **Check Dates**: Always verify date formats after extraction
3. **Verify Amounts**: Double-check all dollar amounts
4. **Edit as Needed**: Don't hesitate to manually adjust extracted data
5. **Test with Example**: Try the "Load Example Contract" first to see the expected format

## 🐛 Troubleshooting

### PDF Upload Not Working?

**Check these:**
1. ✅ Is `OPENAI_API_KEY` set in Vercel environment variables?
2. ✅ Did you redeploy after adding the key?
3. ✅ Is the file actually a PDF (not renamed .docx or .txt)?
4. ✅ Is the PDF text-based (not scanned image)?

### Error: "OpenAI API key not configured"
- Add the API key to Vercel (see Setup section above)
- Redeploy the app
- Try uploading again

### Error: "Could not extract contract details"
- The PDF might be too complex or formatted unusually
- Try manual JSON entry instead
- Or convert PDF to text and copy-paste into JSON format

### Extracted Data is Wrong
- AI isn't perfect - always review extracted data!
- Manually edit the JSON before analysis
- Consider the "Load Example Contract" format as reference

## 🔐 Security & Privacy

- ✅ **No Storage**: PDFs are processed in memory only
- ✅ **No Logging**: Contract data is not saved anywhere
- ✅ **Secure Transmission**: HTTPS encrypted
- ✅ **OpenAI Privacy**: Check [OpenAI's data usage policy](https://openai.com/policies/usage-policies)
- ✅ **Temporary Processing**: Files deleted immediately after extraction

## 🎨 UI Features

- **Drag-and-Drop Style**: Visual upload area with icon
- **Loading State**: Shows "Processing PDF..." while working
- **Error Messages**: Clear feedback if something goes wrong
- **Success Notification**: Alert when extraction succeeds
- **Auto-Clear**: File input clears after each upload

## 📊 Example Use Case

**Before (Manual):**
1. Open PDF contract
2. Find customer name → Type into JSON
3. Find payment amount → Type into JSON
4. Find all dates → Type into JSON
5. Find all periods → Type into JSON
6. Format as valid JSON (easy to make mistakes)
7. Analyze

**After (PDF Upload):**
1. Click upload button
2. Select PDF
3. Wait 5 seconds
4. Review extracted data
5. Analyze

**Time saved: ~5-10 minutes per contract!**

## 🚀 Future Enhancements

Possible improvements:
- [ ] Support for scanned PDFs (OCR)
- [ ] Batch PDF processing
- [ ] Save extracted contracts for later
- [ ] Email PDF directly to the app
- [ ] Support other file formats (Word, Excel)

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for detailed errors
2. Verify your OpenAI API key is correct
3. Try with a different PDF
4. Use manual JSON entry as fallback
5. Check Vercel function logs for server-side errors

---

## ✅ Summary

**PDF Upload** = Huge time-saver! 🚀

Upload a contract, let AI extract the details, review, and analyze. 

Just remember to add your `OPENAI_API_KEY` to Vercel environment variables!

---

**Last Updated**: December 2025  
**Status**: ✅ Deployed and Working!

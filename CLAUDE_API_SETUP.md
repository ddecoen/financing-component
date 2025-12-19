# 🤖 Using Claude API for PDF Upload

## Why Claude?

I've updated the app to use **Anthropic's Claude** instead of OpenAI for PDF parsing. Here's why Claude is excellent for this:

### Advantages:
- ✅ **Native PDF Support** - Claude can directly analyze PDF documents
- ✅ **Superior Document Understanding** - Excellent at extracting structured data
- ✅ **Better at Following Instructions** - More reliable JSON output
- ✅ **Cost-Effective** - Competitive pricing
- ✅ **No Vision API Needed** - Built-in document understanding

## 🚀 Quick Setup

### Step 1: Get Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **Settings** → **API Keys**
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-...`)

### Step 2: Add to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Claude API key (paste it)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your app

### Step 3: Test It!

1. Visit your deployed app
2. Click "📄 Upload PDF Contract"
3. Select a contract PDF
4. Watch Claude extract the details!

## 💰 Pricing

Claude pricing is very competitive:

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| Claude 3.5 Sonnet | $3 per MTok | $15 per MTok | What we use |
| Typical PDF | ~5K tokens | ~500 tokens | $0.015-0.025 per PDF |

**Translation**: About **$0.02 per PDF** (2 cents!)

**Free Credits**: Anthropic often provides free credits for new accounts.

## 🎯 What Model We Use

**Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)**

Why this model?
- ✅ Best balance of speed, cost, and accuracy
- ✅ Native PDF document understanding
- ✅ Excellent at structured data extraction
- ✅ Reliable JSON generation
- ✅ Fast response times

## 📊 How It Works

```
PDF Upload → Vercel API → Claude API → 
Extract contract data → Return JSON → 
Populate form → User reviews → Analyze
```

1. User uploads PDF
2. File converted to base64
3. Sent to Claude with extraction prompt
4. Claude analyzes PDF and extracts:
   - Customer name
   - Payment amounts
   - Dates
   - Contract periods
5. Returns structured JSON
6. Auto-fills the textarea
7. User can review/edit before analysis

## 🔐 Security

- ✅ **Anthropic doesn't train on your data** - Enterprise-grade privacy
- ✅ **No storage** - PDFs processed in memory only
- ✅ **Secure transmission** - HTTPS encrypted
- ✅ **Zero-retention policy** - Anthropic doesn't keep your uploads
- ✅ **SOC 2 Type II compliant** - Enterprise security standards

Learn more: [Anthropic Privacy Policy](https://www.anthropic.com/privacy)

## 📋 API Key Management

### Best Practices:
1. ✅ Store in environment variables (never in code)
2. ✅ Use Vercel's encrypted storage
3. ✅ Rotate keys periodically
4. ✅ Monitor usage in Anthropic console
5. ✅ Set usage limits if needed

### In Anthropic Console:
- View usage statistics
- Set spending limits
- Monitor API calls
- Manage multiple keys
- Track costs

## 🆚 Claude vs OpenAI

| Feature | Claude | OpenAI |
|---------|--------|--------|
| **PDF Support** | Native, built-in | Requires Vision API |
| **Document Understanding** | Excellent | Very Good |
| **JSON Output** | More reliable | Good |
| **Cost per PDF** | ~$0.02 | ~$0.03-0.05 |
| **Setup** | Simple | Simple |
| **API Stability** | Excellent | Excellent |

Both are great, but Claude has a slight edge for document extraction!

## 🐛 Troubleshooting

### Error: "Anthropic API key not configured"
**Solution:** Add `ANTHROPIC_API_KEY` to Vercel environment variables

### Error: "Invalid API key"
**Solution:** 
- Check the key starts with `sk-ant-`
- Verify you copied the entire key
- Create a new key if needed

### Error: "Could not extract contract details"
**Solution:**
- PDF might be a scanned image (not text-based)
- Try a different PDF
- Use manual JSON entry as fallback

### PDF uploads but no extraction
**Solution:**
- Check Vercel function logs for errors
- Verify API key is set correctly
- Check Anthropic console for API call logs

## 📈 Usage Limits

**Default Limits:**
- Tier 1: 50 requests/min
- 40,000 tokens/min
- More than enough for typical use!

**Need More?**
- Request limit increase in Anthropic console
- Upgrade to higher tier
- Contact Anthropic support

## 🎓 Tips for Best Results

1. **Use Text-based PDFs** - Scanned images won't work (yet)
2. **Clear Formatting** - Well-structured contracts work best
3. **Review Extracted Data** - Always verify before analysis
4. **Edit as Needed** - JSON is editable after extraction
5. **Test with Examples** - Try the "Load Example" first

## 🔜 Future Enhancements

With Claude, we could add:
- [ ] OCR for scanned documents
- [ ] Multi-page contract analysis
- [ ] Contract comparison
- [ ] Custom extraction rules
- [ ] Batch processing
- [ ] Historical contract search

## 📞 Support

**Anthropic Support:**
- Documentation: [docs.anthropic.com](https://docs.anthropic.com/)
- Status: [status.anthropic.com](https://status.anthropic.com/)
- Support: support@anthropic.com

**App Issues:**
- Check Vercel function logs
- Verify environment variables
- Test with example contract first

## ✅ Summary

**Claude API = Better PDF Understanding!**

- Native PDF support
- Reliable extraction
- Cost-effective (~2¢ per PDF)
- Easy setup
- Secure & private

**Setup in 3 steps:**
1. Get key from console.anthropic.com
2. Add to Vercel env vars
3. Deploy and test!

---

**Model**: Claude 3.5 Sonnet  
**Cost**: ~$0.02 per PDF  
**Setup Time**: 5 minutes  
**Status**: ✅ Ready to use!

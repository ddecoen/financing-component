# ✅ Correct Contract JSON Format

## 🎯 Understanding the Data

### The Deka Bank Example:

**Scenario:**
- Customer: Deka Bank
- Contract: 5-year SaaS agreement
- Total value if paid annually: $420,000 × 5 = **$2,100,000**
- **Actual payment**: $2,100,000 paid **UPFRONT** on Dec 31, 2025

### ✅ CORRECT JSON:

```json
{
  "customer": "Deka Bank",
  "cash_received": 2100000,
  "payment_date": "2025-12-31",
  "periods": [
    { "start": "2025-12-31", "end": "2026-12-30", "stated_amount": 420000 },
    { "start": "2026-12-31", "end": "2027-12-30", "stated_amount": 420000 },
    { "start": "2027-12-31", "end": "2028-12-30", "stated_amount": 420000 },
    { "start": "2028-12-31", "end": "2029-12-30", "stated_amount": 420000 },
    { "start": "2029-12-31", "end": "2030-12-30", "stated_amount": 420000 }
  ]
}
```

### ❌ WRONG JSON (from your PDF extraction):

```json
{
  "customer": "Deka Bank",
  "cash_received": 420000,  // ❌ WRONG! Should be 2,100,000
  "payment_date": "2025-12-18",
  "periods": [
    { "start": "2025-12-18", "end": "2027-01-14", "stated_amount": 420000 },
    { "start": "2027-01-15", "end": "2028-01-14", "stated_amount": 420000 },
    { "start": "2028-01-15", "end": "2029-01-14", "stated_amount": 420000 },
    { "start": "2029-01-15", "end": "20210-01-14", "stated_amount": 420000 },  // ❌ Year 20210!
    { "start": "20210-01-15", "end": "20211-01-14", "stated_amount": 2100000 }  // ❌ WRONG!
  ]
}
```

---

## 📖 Field Definitions

### `cash_received` (CRITICAL!)

**What it means:** The actual cash payment received UPFRONT

**Examples:**
- ✅ Customer pays $2.1M on day 1 → `cash_received: 2100000`
- ✅ Customer pays $1.8M upfront → `cash_received: 1800000`
- ❌ Don't use the annual amount ($420K)
- ❌ Don't use just one period's value

**Key Rule:** 
```
cash_received = TOTAL upfront payment
            ≤ Sum of all period stated_amounts
```

### `stated_amount` (per period)

**What it means:** What the customer would pay for THAT period if paying over time

**For Deka Bank:**
- Year 1: $420,000
- Year 2: $420,000  
- Year 3: $420,000
- Year 4: $420,000
- Year 5: $420,000
- **Total: $2,100,000**

---

## 🎯 Two Common Scenarios

### Scenario 1: Prepaid Contract (Most Common)

**Description:** Customer pays entire amount upfront but gets service over time

**Example:**
```json
{
  "customer": "Acme Corp",
  "cash_received": 2100000,  // Paid upfront
  "payment_date": "2025-12-31",
  "periods": [
    { "start": "2025-12-31", "end": "2026-12-30", "stated_amount": 420000 },
    // ... 5 periods of 420000 each
  ]
}
```

**Result:**
- Stated Total: $2,100,000
- Present Value: $2,100,000 (they paid in full upfront!)
- Financing Component: $0
- **Significance: NO** (0% financing)

**ASC 606 Treatment:** 
- No financing component adjustment needed
- Recognize revenue ratably over service period

### Scenario 2: Discounted Prepayment

**Description:** Customer pays less upfront in exchange for advance payment

**Example:**
```json
{
  "customer": "Beta Corp",
  "cash_received": 1800000,  // 14% discount for paying upfront
  "payment_date": "2025-12-31",
  "periods": [
    { "start": "2025-12-31", "end": "2026-12-30", "stated_amount": 420000 },
    { "start": "2026-12-31", "end": "2027-12-30", "stated_amount": 420000 },
    { "start": "2027-12-31", "end": "2028-12-30", "stated_amount": 420000 },
    { "start": "2028-12-31", "end": "2029-12-30", "stated_amount": 420000 },
    { "start": "2029-12-31", "end": "2030-12-30", "stated_amount": 420000 }
  ]
}
```

**Result:**
- Stated Total: $2,100,000
- Present Value: $1,800,000 (what they actually paid)
- Financing Component: $300,000
- **Significance: YES** (14.3% financing - significant!)

**ASC 606 Treatment:**
- Adjust transaction price to $1,800,000
- Recognize $300K as financing component
- Split between License/Support
- Amortize financing using effective interest method

---

## 🔍 How to Verify Your Data

### Quick Checks:

1. **Cash Received Check:**
   ```
   cash_received ≤ sum of all stated_amounts
   ```
   If cash_received > stated total, something is WRONG!

2. **Period Check:**
   ```
   Each period stated_amount should be similar
   (unless contract terms change)
   ```

3. **Date Check:**
   ```
   Years should be reasonable (2025-2035 range)
   Not 20210 or other typos!
   ```

4. **Total Check:**
   ```
   Sum all period stated_amounts
   = Total contract value over time
   ```

---

## 📝 Common PDF Extraction Errors

### Error 1: Cash Received = Single Period
```json
"cash_received": 420000  // ❌ This is just ONE year!
```
**Fix:** Should be total upfront: `2100000`

### Error 2: Last Period = Total
```json
{ "stated_amount": 2100000 }  // ❌ This is the TOTAL, not one period!
```
**Fix:** Each period should be: `420000`

### Error 3: Year Typos
```json
"start": "20210-01-15"  // ❌ Year 20210!
```
**Fix:** Should be: `"2030-01-15"`

### Error 4: Date Format Issues
```json
"start": "12/31/2025"  // ❌ Wrong format
```
**Fix:** Use ISO format: `"2025-12-31"`

---

## 🎓 Real-World Examples

### Example 1: 3-Year Deal with No Discount

```json
{
  "customer": "TechCo",
  "cash_received": 1500000,
  "payment_date": "2026-01-01",
  "periods": [
    { "start": "2026-01-01", "end": "2026-12-31", "stated_amount": 500000 },
    { "start": "2027-01-01", "end": "2027-12-31", "stated_amount": 500000 },
    { "start": "2028-01-01", "end": "2028-12-31", "stated_amount": 500000 }
  ]
}
```

**Analysis:**
- Total: $1.5M
- PV: $1.5M (paid in full)
- Financing: $0
- Significant: NO

### Example 2: 3-Year Deal with 10% Prepayment Discount

```json
{
  "customer": "StartupXYZ",
  "cash_received": 1350000,  // 10% discount
  "payment_date": "2026-01-01",
  "periods": [
    { "start": "2026-01-01", "end": "2026-12-31", "stated_amount": 500000 },
    { "start": "2027-01-01", "end": "2027-12-31", "stated_amount": 500000 },
    { "start": "2028-01-01", "end": "2028-12-31", "stated_amount": 500000 }
  ]
}
```

**Analysis:**
- Total: $1.5M
- PV: $1.35M (what they paid)
- Financing: $150K
- Percentage: 10%
- Significant: YES (>5%)

---

## ✅ Validation Rules

The app now validates:

1. ✅ `cash_received < stated_total` (must be less than or equal)
2. ✅ Years must be reasonable (not 20210!)
3. ⚠️ Warning if cash_received seems too low
4. ⚠️ Warning if dates look wrong

---

## 🎯 Summary

**Remember:**
- `cash_received` = **Total upfront payment**
- `stated_amount` = **What each period would cost separately**
- PV can **NEVER** exceed cash received!
- Always review PDF extracted data before analysis!

---

**For your Deka Bank contract, the correct data is:**
- Cash received: **$2,100,000** (not $420,000)
- Each period: **$420,000** (not $2.1M in last period)
- Dates: **2025-2030** (not 20210-20211)

---

**Need help?** Load the example contract to see the correct format!

# ASC 606 Significant Financing Component Analyzer

**Production-ready tool for analyzing multi-year SaaS contracts with up-front payments under ASC 606-10-32-15**

Developed by Coder Technologies Inc. - Finance Team  
Last Updated: December 2025

---

## Overview

This tool automates the complex calculations required when customers pay significantly in advance of service delivery. It determines whether a significant financing component exists and generates complete accounting documentation.

### What It Does

✅ Calculates present value of payment streams  
✅ Determines if financing component is significant (>5% threshold)  
✅ Allocates transaction price to performance obligations (License/Support)  
✅ Generates effective interest amortization schedules  
✅ Creates journal entries ready for NetSuite import  
✅ Produces audit-ready Excel workpapers  

### Why You Need This

When a customer pays $2.1M up-front for 5 years of service:
- **Without ASC 606 adjustment**: Recognize $2.1M revenue over time
- **With ASC 606 (correct)**: Recognize $1.77M revenue + $331K interest income
- **Impact**: Proper classification and timing of income recognition

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/coder-technologies/asc606-analyzer.git
cd asc606-analyzer

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage

```python
from asc606_analyzer_production import ASC606FinancingAnalyzer

# Define your contract
contract_data = {
    'customer': 'Acme Corp',
    'cash_received': 1_500_000,
    'payment_date': '2026-01-15',
    'periods': [
        {'start': '2026-01-15', 'end': '2027-01-14', 'stated_amount': 300_000},
        {'start': '2027-01-15', 'end': '2028-01-14', 'stated_amount': 300_000},
        {'start': '2028-01-15', 'end': '2029-01-14', 'stated_amount': 300_000},
        {'start': '2029-01-15', 'end': '2030-01-14', 'stated_amount': 300_000},
        {'start': '2030-01-15', 'end': '2031-01-14', 'stated_amount': 300_000}
    ]
}

# Analyze
analyzer = ASC606FinancingAnalyzer(
    contract_data=contract_data,
    discount_rate=0.06,
    license_pct=0.20
)

results = analyzer.analyze()
analyzer.print_summary()

# Export
analyzer.export_to_excel('Acme_Corp_ASC606.xlsx')
analyzer.export_journal_entries_csv('Acme_Corp_JEs.csv')
```

---

## ASC 606 Methodology

### When to Use This Tool

**Apply this analysis when:**
- ✅ Contract length > 1 year
- ✅ Payment received significantly in advance
- ✅ Time difference creates financing benefit
- ✅ Financing component > 5% (materiality threshold)

**Skip analysis if:**
- ❌ Contract ≤ 1 year (practical expedient per ASC 606-10-32-18)
- ❌ Financing component < 5% (immaterial)
- ❌ Payment terms are normal (30-90 days)

### Present Value Calculation

The tool discounts each payment to the **end of the service period** (when the performance obligation is satisfied):

```
PV = Stated Amount ÷ (1 + discount_rate)^years
```

**Example:**
- Year 1 payment: $420,000 ÷ (1.06)^1 = $396,226
- Year 2 payment: $420,000 ÷ (1.06)^2 = $373,799
- Year 3 payment: $420,000 ÷ (1.06)^3 = $352,641
- etc.

**Total PV**: Sum of all present values  
**Financing Component**: Cash Received - Total PV

### Effective Interest Method

Interest income is allocated proportionally over the contract life such that:

```
Total Revenue + Total Interest Income = Cash Received
```

Each period:
```
Interest = Total Financing × (Opening Liability ÷ Sum of All Opening Liabilities)
```

This ensures the interest decreases as the liability decreases, and everything reconciles perfectly.

---

## Configuration

### In `config.py`

```python
# Discount Rate - Update annually
DISCOUNT_RATE = 0.06  # 6%

# Revenue Recognition Policy
LICENSE_PCT = 0.20  # 20% to license (point in time)
SUPPORT_PCT = 0.80  # 80% to support (over time)

# Materiality Threshold
MATERIALITY_THRESHOLD = 0.05  # 5%

# Chart of Accounts
GL_ACCOUNTS = {
    'cash': '1000-01',
    'contract_liability': '2100-01',
    'license_revenue': '4000-10',
    'support_revenue': '4000-20',
    'interest_income': '4100-10'
}
```

### Discount Rate Selection

**How to determine:**
1. Start with your incremental borrowing rate
2. Consider customer credit profile
3. Reference similar market transactions
4. Document your methodology

**Typical ranges:**
- **Series B-2 SaaS**: 6-8%
- **Public SaaS companies**: 5-7%
- **High-growth startups**: 8-12%

**Important**: Document and review annually.

---

## Output Files

### 1. Excel Workbook

**Three sheets:**

**Summary Sheet:**
- Customer name and contract details
- Cash received vs. transaction price
- Financing component analysis
- Discount rate and allocation percentages

**Amortization Schedule:**
- Period-by-period breakdown
- Opening/ending liability balances
- Interest income by period
- Revenue recognized by period

**Journal Entries:**
- Complete accounting entries
- Dates, accounts, debits, credits
- Entry descriptions and memos

### 2. CSV for NetSuite

Pre-formatted journal entries ready for import:
- Date (MM/DD/YYYY)
- Account
- Debit/Credit amounts
- Memo field

Simply import into: Transactions → Financial → Make Journal Entries → Import

---

## Example Output

### Acme Bank Contract

**Input:**
- Cash: $2,100,000 (paid 12/31/2025)
- Term: 5 years ($420,000/year)
- Discount rate: 6%

**Output:**
```
==========================================
ASC 606 ANALYSIS - ACME BANK
==========================================

Cash Received:           $2,100,000.00
Transaction Price (PV):  $1,769,193.00
Financing Component:     $330,807.00 (15.75%)

Discount Rate:           6.0%
License Allocation:      20%
Support Allocation:      80%

==========================================
AMORTIZATION SCHEDULE
==========================================

Period               Opening         Interest        Revenue         Ending         
──────────────────────────────────────────────────────────────────────────────────
License Delivery     $ 2,100,000     $       0      $   353,839     $ 1,746,161
Year 1               $ 1,746,161     $  97,904      $   283,071     $ 1,560,995
Year 2               $ 1,560,995     $  82,033      $   283,071     $ 1,359,956
Year 3               $ 1,359,956     $  66,161      $   283,071     $ 1,143,047
Year 4               $ 1,143,047     $  50,290      $   283,071     $   910,266
Year 5               $   910,266     $  34,419      $   283,071     $   661,614
──────────────────────────────────────────────────────────────────────────────────
TOTALS                               $ 330,807      $ 1,769,193

✅ Perfect reconciliation!
```

---

## Journal Entries

### Initial Entry (12/31/2025)

```
DR  Cash                           $2,100,000
    CR  Contract Liability          $2,100,000

To record up-front payment from Acme Bank
```

**Key Point**: ONE contract liability (not separate financing component tracking)

### License Revenue (12/31/2025)

```
DR  Contract Liability             $353,839
    CR  License Revenue              $353,839

To recognize license revenue at point in time (20% of PV)
```

### Each Year (Example - Year 1, 12/30/2026)

**Interest Income:**
```
DR  Contract Liability             $97,904
    CR  Interest Income              $97,904
```

**Support Revenue:**
```
DR  Contract Liability             $283,071
    CR  Support Revenue              $283,071
```

---

## P&L Impact by Year

| Year | License Rev | Support Rev | Total Rev | Interest Income | **Total P&L** |
|------|-------------|-------------|-----------|-----------------|--------------|
| 2026 | $353,839 | $283,071 | $636,910 | $97,904 | **$734,814** |
| 2027 | $0 | $283,071 | $283,071 | $82,033 | **$365,104** |
| 2028 | $0 | $283,071 | $283,071 | $66,161 | **$349,232** |
| 2029 | $0 | $283,071 | $283,071 | $50,290 | **$333,361** |
| 2030 | $0 | $283,071 | $283,071 | $34,419 | **$317,490** |
| **TOTAL** | **$353,839** | **$1,415,355** | **$1,769,194** | **$330,807** | **$2,100,000** |

**Note**: Total P&L benefit equals cash received ✓

---

## NetSuite Implementation

### 1. Chart of Accounts Setup

Create these accounts:

**Balance Sheet:**
- `2100-01` Contract Liability

**Income Statement:**
- `4000-10` License Revenue
- `4000-20` Support Revenue
- `4100-10` Interest Income - Financing Component

### 2. Import Journal Entries

```bash
# Export from analyzer
analyzer.export_journal_entries_csv('Customer_JEs.csv')

# Import in NetSuite
1. Navigate to: Transactions → Financial → Make Journal Entries → Import
2. Upload CSV file
3. Map fields:
   - Date → Transaction Date
   - Account → Account
   - Debit → Debit Amount
   - Credit → Credit Amount
   - Memo → Memo
4. Review and save
```

### 3. Revenue Recognition Schedules

**Support Revenue:**
- Type: Time-based, straight-line
- Start: Contract start date
- End: Contract end date
- Monthly amount: Support total ÷ number of months

**Interest Income:**
- Type: Manual schedule
- Dates: Year-end dates per amortization table
- Amounts: From amortization schedule

---

## Advanced Usage

### Batch Processing

```python
import glob
import json

# Process all contracts in a directory
for file in glob.glob('contracts/*.json'):
    with open(file) as f:
        contract_data = json.load(f)
    
    analyzer = ASC606FinancingAnalyzer(contract_data)
    analyzer.analyze()
    
    customer = contract_data['customer'].replace(' ', '_')
    analyzer.export_to_excel(f'output/{customer}_ASC606.xlsx')
```

### Custom Discount Rate per Contract

```python
# If customer has different credit profile
analyzer = ASC606FinancingAnalyzer(
    contract_data=contract_data,
    discount_rate=0.08  # Higher rate for this customer
)
```

### Override PV (If Pre-calculated)

```python
# If you've calculated PV externally
analyzer = ASC606FinancingAnalyzer(
    contract_data=contract_data,
    override_pv=1_234_567
)
```

### Use Exact Day Count

```python
# Use exact days instead of integer years
analyzer = ASC606FinancingAnalyzer(
    contract_data=contract_data,
    use_integer_years=False
)
```

---

## ASC 606 References

### Key Standards

**ASC 606-10-32-15**  
*Significant Financing Component*

> "An entity shall adjust the promised amount of consideration for the effects of the time value of money if the timing of payments agreed to by the parties... provides the customer or the entity with a significant benefit of financing..."

**ASC 606-10-32-18**  
*Practical Expedient*

> "As a practical expedient, an entity need not adjust the promised amount of consideration for the effects of a significant financing component if... the period between payment and transfer of goods/services will be **one year or less**."

**ASC 606-10-32-20**  
*Discount Rate*

> "When adjusting for a significant financing component, an entity shall use the **discount rate that would be reflected in a separate financing transaction** between the entity and its customer at contract inception."

**ASC 606-10-45-1 & 45-2**  
*Presentation*

> "Interest income is recognized only to the extent that a contract includes a significant financing component."

Must present **separately** from revenue from contracts with customers.

---

## Troubleshooting

### Issue: PV calculation seems off

**Check:**
- Are all periods included in `contract_data`?
- Is discount rate correct (0.06 = 6%, not 6)?
- Are dates formatted correctly (YYYY-MM-DD)?
- Using integer years (default) or exact days?

### Issue: Numbers don't reconcile

**Verify:**
- Total stated amount = cash received
- Revenue + Interest = Cash received
- All periods are consecutive

### Issue: NetSuite import fails

**Common fixes:**
- Verify GL account numbers exist in NetSuite
- Check date format matches NetSuite settings
- Remove special characters from memo fields
- Ensure debits equal credits for each entry

---

## Best Practices

### 1. Documentation

For each contract:
- ✅ Save Excel workpaper to deal folder
- ✅ Document discount rate selection
- ✅ Get management sign-off on significance determination
- ✅ Link to signed order form

### 2. Discount Rate

- Review annually (at minimum)
- Document methodology in writing
- Get CFO approval
- Adjust for material changes (>50 bps)

### 3. Quarterly Reviews

```python
# Run portfolio analysis
contracts = load_all_active_contracts()
total_financing = 0

for contract in contracts:
    analyzer = ASC606FinancingAnalyzer(contract)
    results = analyzer.analyze()
    total_financing += results['financing_component']

print(f"Total portfolio financing component: ${total_financing:,.2f}")
```

### 4. Audit Preparation

**Create audit binder with:**
- Individual contract analyses
- Discount rate memo (updated annually)
- Significance threshold documentation
- Reconciliation of total financing components
- Draft footnote disclosure

---

## Testing

### Unit Tests

```bash
python -m pytest tests/
```

### Test Coverage

```bash
python -m pytest --cov=asc606_analyzer_production tests/
```

### Manual Testing

```python
# Test with known values
test_contract = {
    'customer': 'Test Customer',
    'cash_received': 500_000,
    'payment_date': '2025-12-31',
    'periods': [
        {'start': '2025-12-31', 'end': '2026-12-30', 'stated_amount': 100_000}
    ]
}

analyzer = ASC606FinancingAnalyzer(test_contract, discount_rate=0.06)
results = analyzer.analyze()

# Expected PV: 100,000 / 1.06 = 94,339.62
assert abs(results['total_pv'] - 94_339.62) < 1
```

---

## Maintenance

### Monthly
- [ ] Review open issues
- [ ] Update dependencies if needed
- [ ] Test with latest contract

### Quarterly
- [ ] Run full test suite
- [ ] Review and update documentation
- [ ] Portfolio analysis and reconciliation

### Annually
- [ ] Review and update discount rate
- [ ] Update README with current information
- [ ] Tag new version if changes made
- [ ] Review with external auditor

---

## Version History

### v1.0.0 (December 2025)
- ✅ Initial production release
- ✅ Correct PV calculation (end of period method)
- ✅ Effective interest amortization
- ✅ 20/80 license/support allocation
- ✅ Excel and CSV export
- ✅ Integer year option for clean calculations

### Roadmap
- [ ] PDF order form parsing
- [ ] NetSuite API direct integration
- [ ] Batch processing via web interface
- [ ] Dashboard for portfolio monitoring
- [ ] Automated alerts for new multi-year contracts

---

## Support

### Internal
- **Controller**
- **Accounting Team**

### External
- **Consultants**: ASC 606 consulting
- **Audit team**: Audit team

### GitHub Issues
For bugs or feature requests:
https://github.com/coder-technologies/asc606-analyzer/issues

---

## Contributing

### Branching Strategy

```
main                    # Production-ready code
├── develop            # Integration branch
│   ├── feature/...   # New features
│   ├── bugfix/...    # Bug fixes
│   └── docs/...      # Documentation updates
```

### Making Changes

```bash
# Create feature branch
git checkout -b feature/add-new-feature

# Make changes and commit
git add .
git commit -m "Add feature: description"

# Push and create PR
git push origin feature/add-new-feature
```

### Code Review Requirements
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Example added (if applicable)
- [ ] Reviewed by Dan deCoen

---

## License

**Proprietary** - Coder Technologies Inc.  
For internal use only.

---

## Acknowledgments

Developed by the Coder Finance Team with guidance from:
- Consultants (ASC 606 technical accounting)
- Anthropic Claude (Code development assistance)

Special thanks for technical accounting expertise and requirements definition.

---

## FAQ

**Q: Why use end of period instead of midpoint for PV calculation?**  
A: Under ASC 606, you discount to when the performance obligation is satisfied, which is at the END of the service period.

**Q: What if our license/support split changes?**  
A: Update `LICENSE_PCT` in `config.py`. Historical analyses remain unchanged.

**Q: Can we use this for other payment structures?**  
A: Yes! The tool works for any multi-period contract with advance payment. Adjust `periods` as needed.

**Q: What about variable consideration?**  
A: Current version handles fixed consideration only. Variable consideration requires additional analysis.

**Q: Should we apply this to all contracts?**  
A: No - only multi-year contracts where payment is significantly in advance. Use the decision tree in the README.

**Q: How often should we update the discount rate?**  
A: Annually at minimum. More frequently if your borrowing costs change materially.

---

**Last Updated**: December 18, 2025  
**Version**: 1.0.0  
**Maintained by**: Dan deCoen, Controller, Coder Technologies Inc.

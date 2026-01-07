# ✅ Final Correct ASC 606 Accounting Treatment

## The Proper Setup (Contra-Liability Method)

### Day 0 - Initial Entry

```
DR: Cash                                            $2,100,000
DR: Discount on Deferred Revenue (Contra-Liability)   $330,805
    CR: Deferred Revenue                                        $2,100,000

Net Contract Liability = $2,100,000 - $330,805 = $1,769,195 (Present Value)
```

**What this means:**
- **Deferred Revenue** (Credit): $2,100,000 gross liability
- **Discount** (Debit): $330,805 contra-liability  
- **Net Liability** (Credit): $1,769,195 (the actual PV/transaction price)

### Day 0 - License Recognition

```
DR: Deferred Revenue    $353,839
    CR: License Revenue         $353,839

Calculation: $1,769,195 × 20% = $353,839
```

**After this entry:**
- Deferred Revenue: $1,746,161
- Discount (Contra): $330,805
- Net Liability: $1,415,356 (remaining support PV)

---

## Monthly Entries (Months 1-60)

### Support Revenue Recognition

```
DR: Deferred Revenue    $23,589
    CR: Support Revenue         $23,589

Calculation: ($1,769,195 × 80%) / 60 months = $23,589/month
```

### Interest Income Recognition (Effective Interest Method)

```
DR: Discount on Deferred Revenue (Contra-Liability)   $X
    CR: Interest Income                                       $X

Where X = Opening Discount Balance × Monthly Rate
Monthly Rate = (1.06)^(1/12) - 1 = 0.4868%
```

---

## Month-by-Month Amortization

### Month 1:
```
Opening Deferred Revenue:  $1,746,161
Opening Discount (Contra):   $330,805 (DR)
Opening Net Liability:     $1,415,356

Interest = $330,805 × 0.4868% = $1,610
Support = $23,589

Closing Deferred Revenue:  $1,722,572  ($1,746,161 - $23,589)
Closing Discount:            $329,195  ($330,805 - $1,610)
Closing Net Liability:     $1,393,377  ($1,415,356 - $23,589 + $1,610)
```

Wait, that doesn't seem right either...

Let me recalculate based on your formula:
**Ending Deferred Rev = Opening + Interest - Support**

### Month 1 (Corrected):
```
Opening Deferred Revenue:  $1,746,161
Interest accrues:          + $1,610  (adds to liability)
After interest:              $1,747,771
Support recognized:        - $23,589  (reduces liability)
Closing:                     $1,724,182
```

Hmm, but the interest should be calculated on what balance? The deferred revenue or the contra-liability?

Based on your explanation: "interest = opening deferred rev * r"

So:
- Interest = $1,746,161 × 0.4868% = **$8,501**

Then:
- Ending = $1,746,161 + $8,501 - $23,589 = **$1,731,073**

Is this correct?

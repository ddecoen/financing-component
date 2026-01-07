import { NextRequest, NextResponse } from 'next/server';

interface Period {
  start: string;
  end: string;
  stated_amount: number;
}

interface ContractData {
  customer: string;
  cash_received: number;
  payment_date: string;
  periods: Period[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_data, discount_rate = 0.06, license_pct = 0.20 } = body;

    if (!contract_data) {
      return NextResponse.json(
        { success: false, error: 'Missing contract_data' },
        { status: 400 }
      );
    }

    // Validate contract data
    const validation = validateContractData(contract_data);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, warnings: validation.warnings },
        { status: 400 }
      );
    }

    // Perform calculations
    const results = calculateASC606(contract_data, discount_rate, license_pct);

    return NextResponse.json({
      success: true,
      results,
      excel_file: '', // We'll handle file generation client-side or later
      csv_file: '',
      warnings: validation.warnings
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function validateContractData(contractData: ContractData) {
  const warnings: string[] = [];
  
  // Check if periods exist
  if (!contractData.periods || contractData.periods.length === 0) {
    return {
      valid: false,
      error: 'No contract periods defined',
      warnings
    };
  }
  
  const statedTotal = contractData.periods.reduce((sum, p) => sum + p.stated_amount, 0);
  
  // For ASC 606, cash_received can be equal to stated total (no discount)
  // or less than stated total (if discounted)
  // But it should generally be close
  if (contractData.cash_received > statedTotal * 1.1) {
    warnings.push(`Cash received ($${contractData.cash_received.toLocaleString()}) is more than 10% higher than stated total ($${statedTotal.toLocaleString()}). Please verify amounts.`);
  }
  
  // Check for unrealistic dates
  contractData.periods.forEach((period, index) => {
    const startYear = parseInt(period.start.split('-')[0]);
    const endYear = parseInt(period.end.split('-')[0]);
    
    if (startYear > 2100 || endYear > 2100) {
      warnings.push(`Period ${index + 1} has unrealistic year (${startYear} or ${endYear}). Please check date format.`);
    }
    
    if (startYear < 2020) {
      warnings.push(`Period ${index + 1} has year in the past (${startYear}). Please check date.`);
    }
  });
  
  return { valid: true, warnings };
}

function calculateASC606(contractData: ContractData, discountRate: number, licensePct: number) {
  const supportPct = 1 - licensePct;
  const periods = contractData.periods;
  const cashReceived = contractData.cash_received;
  const statedTotal = periods.reduce((sum, p) => sum + p.stated_amount, 0);
  
  // GOLD STANDARD METHOD (Big 4 Preferred):
  // Calculate PV using the SAME monthly delivery pattern as revenue recognition
  
  // Monthly effective rate
  const monthlyRate = Math.pow(1 + discountRate, 1/12) - 1;
  
  const totalMonths = periods.length * 12;  // 60 months for 5-year contract
  
  // Step 1a: License portion delivered at inception (Month 0) - no discounting
  const licenseStatedAmount = statedTotal * licensePct;  // 20% of $2.1M = $420K
  const licensePV = licenseStatedAmount;  // Delivered at t=0, so PV = stated
  
  // Step 1b: Support delivered end-of-month for months 1-60 - discount each payment
  const monthlySupportStatedAmount = (statedTotal * supportPct) / totalMonths;  // 80% / 60 months
  
  let supportPV = 0;
  for (let month = 1; month <= totalMonths; month++) {
    // Discount each monthly support payment back to t=0
    const monthlyPV = monthlySupportStatedAmount / Math.pow(1 + monthlyRate, month);
    supportPV += monthlyPV;
  }
  
  // Step 1c: Total PV = License PV (t=0) + Support PV (discounted monthly)
  const totalPV = licensePV + supportPV;
  
  // Step 1d: Discount (SFC) = Cash - PV
  const financingComponent = cashReceived - totalPV;
  const financingPercentage = financingComponent / cashReceived;
  const isSignificant = Math.abs(financingPercentage) > 0.05;
  
  // Create PV analysis for display (annual view for reference)
  const pvAnalysis = periods.map((period, index) => {
    const stated = period.stated_amount;
    const years = index + 1;
    
    // For display purposes, show annual PV using annual discounting
    const pv = stated / Math.pow(1 + discountRate, years);
    const financing = stated - pv;
    
    return {
      period: years,
      start: period.start,
      end: period.end,
      stated_amount: stated,
      years_discounted: years,
      present_value: Math.round(pv * 100) / 100,
      financing_component: Math.round(financing * 100) / 100
    };
  });

  // Step 2: Allocate PV 20/80
  const licenseRevenue = totalPV * licensePct;  // 20% of PV
  const supportRevenue = totalPV * supportPct;  // 80% of PV
  
  // For display purposes only (not used in accounting)
  const licenseFinancing = financingComponent * licensePct;
  const supportFinancing = financingComponent * supportPct;

  // Generate amortization schedules (simplified)
  const licenseSchedule = generateAmortizationSchedule(
    licenseRevenue,
    licenseFinancing,
    discountRate,
    periods,
    'License'
  );

  const supportSchedule = generateAmortizationSchedule(
    supportRevenue,
    supportFinancing,
    discountRate,
    periods,
    'Support'
  );

  // Generate journal entries with effective interest method
  const { entries: journalEntries, amortizationSchedule } = generateJournalEntries(
    contractData,
    totalPV,
    financingComponent,
    licenseRevenue,
    supportRevenue,
    licenseSchedule,
    supportSchedule,
    discountRate
  );

  return {
    stated_total: statedTotal,
    cash_received: contractData.cash_received,
    present_value: Math.round(totalPV * 100) / 100,
    financing_component: Math.round(financingComponent * 100) / 100,
    financing_percentage: financingPercentage,
    is_significant: isSignificant,
    license_revenue: Math.round(licenseRevenue * 100) / 100,
    license_financing: Math.round(licenseFinancing * 100) / 100,
    support_revenue: Math.round(supportRevenue * 100) / 100,
    support_financing: Math.round(supportFinancing * 100) / 100,
    pv_analysis: pvAnalysis,
    license_schedule: licenseSchedule,
    support_schedule: supportSchedule,
    journal_entries: journalEntries,
    amortization_schedule: amortizationSchedule
  };
}

function generateAmortizationSchedule(
  initialRevenue: number,
  totalFinancing: number,
  rate: number,
  periods: Period[],
  type: string
) {
  const schedule = [];
  let carryingValue = initialRevenue;
  const financingPerPeriod = totalFinancing / periods.length;

  for (let i = 0; i < periods.length; i++) {
    const interestIncome = carryingValue * rate / periods.length;
    const revenueRecognized = (initialRevenue / periods.length);
    
    schedule.push({
      period: i + 1,
      start_date: periods[i].start,
      end_date: periods[i].end,
      beginning_balance: Math.round(carryingValue * 100) / 100,
      revenue_recognized: Math.round(revenueRecognized * 100) / 100,
      interest_income: Math.round(interestIncome * 100) / 100,
      ending_balance: Math.round((carryingValue - revenueRecognized + interestIncome) * 100) / 100,
      type
    });

    carryingValue = carryingValue - revenueRecognized + interestIncome;
  }

  return schedule;
}

function generateJournalEntries(
  contractData: ContractData,
  totalPV: number,
  financingComponent: number,
  licenseRevenue: number,
  supportRevenue: number,
  licenseSchedule: any[],
  supportSchedule: any[],
  discountRate: number
) {
  const entries = [];
  const cashReceived = contractData.cash_received;
  const numPeriods = contractData.periods.length;
  const monthsPerPeriod = 12;
  const totalMonths = numPeriods * monthsPerPeriod;

  // Calculate monthly interest rate using compound interest formula
  // Monthly rate = (1 + annual rate)^(1/12) - 1
  const monthlyRate = Math.pow(1 + discountRate, 1/12) - 1;

  // Entry 1: Day 0 - Record cash receipt with deferred revenue and contra-liability
  // DR: Cash $2,100,000
  // CR: Deferred Revenue $2,100,000
  // DR: Discount on Deferred Revenue (Contra-Liability) $330,805
  // CR: Discount on Deferred Revenue (Contra-Liability) is a debit to offset
  // Net Contract Liability = $2,100,000 - $330,805 = $1,769,195 (the PV)
  entries.push({
    entry_num: 1,
    date: new Date(contractData.payment_date),
    description: `Day 0 - Cash receipt and deferred revenue - ${contractData.customer}`,
    debits: [
      { account: 'Cash', amount: Math.round(cashReceived * 100) / 100 },
      { account: 'Discount on Deferred Revenue (Contra-Liability)', amount: Math.round(financingComponent * 100) / 100 }
    ],
    credits: [
      { account: 'Deferred Revenue', amount: Math.round(cashReceived * 100) / 100 }
    ]
  });

  // Entry 2: Day 0 - Recognize License Revenue (20% of transaction price/PV)
  const licenseAmount = totalPV * 0.20;
  entries.push({
    entry_num: 2,
    date: new Date(contractData.payment_date),
    description: `Day 0 - Recognize License Revenue (20% of transaction price)`,
    debits: [
      { account: 'Deferred Revenue', amount: Math.round(licenseAmount * 100) / 100 }
    ],
    credits: [
      { account: 'License Revenue', amount: Math.round(licenseAmount * 100) / 100 }
    ]
  });

  // Calculate support revenue recognized per month (straight-line)
  // Support = 80% of PV, recognized over 60 months
  const monthlySupportRevenue = (totalPV * 0.80) / totalMonths;
  
  // CORRECT ACCOUNTING TREATMENT (Contra-Liability Method):
  //
  // Day 0 Entry:
  // DR: Cash                           $2,100,000
  // DR: Discount on Def Rev (Contra)     $330,805
  //     CR: Deferred Revenue                       $2,100,000
  // Net Contract Liability = $2,100,000 - $330,805 = $1,769,195
  //
  // Day 0 License Recognition:
  // DR: Deferred Revenue               $353,839
  //     CR: License Revenue                        $353,839
  //
  // After Day 0:
  // Deferred Revenue (gross): $1,746,161
  // Discount (contra-liability): $330,805
  // Net Contract Liability: $1,746,161 - $330,805 = $1,415,356
  //
  // Each Month:
  // Interest = Opening Net Contract Liability × Monthly Rate
  // Ending Net = Opening Net + Interest - Support Revenue
  
  let deferredRevenue = cashReceived - licenseAmount;  // $1,746,161
  let discount = financingComponent;  // $330,805 (DR balance)
  
  // Store amortization schedule for transparency
  const amortizationSchedule = [];

  // Generate monthly entries using effective interest method
  const startDate = new Date(contractData.payment_date);
  
  for (let month = 1; month <= totalMonths; month++) {
    const entryDate = new Date(startDate);
    entryDate.setMonth(entryDate.getMonth() + month);
    
    const periodNum = Math.ceil(month / monthsPerPeriod);
    const monthInPeriod = ((month - 1) % monthsPerPeriod) + 1;

    // Calculate NET contract liability (opening balance for this month)
    const openingNetLiability = deferredRevenue - discount;

    // Calculate interest using effective interest method
    // Interest = Opening NET Contract Liability × Monthly Rate
    const monthlyInterestIncome = openingNetLiability * monthlyRate;

    // Store opening balances
    const openingDeferredRevenue = deferredRevenue;
    const openingDiscount = discount;

    // Reduce deferred revenue by support revenue recognized
    deferredRevenue = deferredRevenue - monthlySupportRevenue;
    
    // Reduce discount (contra-liability) by interest income recognized
    discount = discount - monthlyInterestIncome;
    
    // Calculate closing balances
    const closingNetLiability = deferredRevenue - discount;

    // Store in amortization schedule
    amortizationSchedule.push({
      month,
      period: periodNum,
      opening_deferred_revenue: Math.round(openingDeferredRevenue * 100) / 100,
      opening_contra_liability: Math.round(openingDiscount * 100) / 100,
      opening_net_liability: Math.round(openingNetLiability * 100) / 100,
      support_revenue: Math.round(monthlySupportRevenue * 100) / 100,
      interest_income: Math.round(monthlyInterestIncome * 100) / 100,
      closing_deferred_revenue: Math.round(deferredRevenue * 100) / 100,
      closing_contra_liability: Math.round(discount * 100) / 100,
      closing_net_liability: Math.round(closingNetLiability * 100) / 100
    });

    // Monthly Support Revenue Recognition (straight-line)
    entries.push({
      entry_num: entries.length + 1,
      date: entryDate,
      description: `Month ${month} (Year ${periodNum}, Mo ${monthInPeriod}) - Support Revenue Recognition`,
      debits: [
        { account: 'Deferred Revenue (Gross)', amount: Math.round(monthlySupportRevenue * 100) / 100 }
      ],
      credits: [
        { account: 'Support Revenue', amount: Math.round(monthlySupportRevenue * 100) / 100 }
      ]
    });

    // Monthly Interest Expense (Unwind Discount - Effective Interest Method)
    // DR: Interest Expense
    // CR: Discount on Contract Liability (reduces the contra-liability)
    entries.push({
      entry_num: entries.length + 1,
      date: entryDate,
      description: `Month ${month} (Year ${periodNum}, Mo ${monthInPeriod}) - Interest Expense (Unwind Discount)`,
      debits: [
        { account: 'Interest Expense', amount: Math.round(monthlyInterestIncome * 100) / 100 }
      ],
      credits: [
        { account: 'Discount on Contract Liability', amount: Math.round(monthlyInterestIncome * 100) / 100 }
      ]
    });
  }

  // Return both entries and amortization schedule
  return { entries, amortizationSchedule };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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
  
  // ASC 606 Logic (matching Python implementation):
  // Use integer years (1, 2, 3, 4, 5) for cleaner calculation
  // Discount each period's stated amount to present value
  // Total Financing = Sum of (Stated - PV) for each period
  
  const statedTotal = periods.reduce((sum, p) => sum + p.stated_amount, 0);
  
  // Calculate PV using simple integer years (like Python code)
  let totalPV = 0;
  let totalFinancingFromPeriods = 0;
  
  const pvAnalysis = periods.map((period, index) => {
    const stated = period.stated_amount;
    const years = index + 1; // Simple: 1, 2, 3, 4, 5...
    
    // PV = Stated / (1 + rate)^years
    const pv = stated / Math.pow(1 + discountRate, years);
    const financing = stated - pv;
    
    totalPV += pv;
    totalFinancingFromPeriods += financing;
    
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
  
  // Total financing component is the sum of financing from all periods
  // This should equal: Stated Total - Total PV
  const financingComponent = statedTotal - totalPV;
  const financingPercentage = financingComponent / statedTotal;
  const isSignificant = Math.abs(financingPercentage) > 0.05;

  // Allocate to License and Support
  const licenseRevenue = totalPV * licensePct;
  const licenseFinancing = financingComponent * licensePct;
  const supportRevenue = totalPV * supportPct;
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

  // Generate journal entries (simplified)
  const journalEntries = generateJournalEntries(
    contractData,
    totalPV,
    financingComponent,
    licenseRevenue,
    supportRevenue,
    licenseSchedule,
    supportSchedule
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
    journal_entries: journalEntries
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
  supportSchedule: any[]
) {
  const entries = [];

  // Initial entry
  entries.push({
    entry_num: 1,
    date: new Date(contractData.payment_date),
    description: `Initial recognition - ${contractData.customer}`,
    debits: [
      { account: 'Cash', amount: contractData.cash_received }
    ],
    credits: [
      { account: 'Deferred Revenue - License', amount: Math.round(licenseRevenue * 100) / 100 },
      { account: 'Deferred Revenue - Support', amount: Math.round(supportRevenue * 100) / 100 },
      { account: 'Contract Liability - Financing', amount: Math.round(financingComponent * 100) / 100 }
    ]
  });

  // Add recognition entries for each period (simplified)
  licenseSchedule.forEach((period, index) => {
    entries.push({
      entry_num: entries.length + 1,
      date: new Date(period.end_date),
      description: `Period ${period.period} - License Revenue Recognition`,
      debits: [
        { account: 'Deferred Revenue - License', amount: period.revenue_recognized }
      ],
      credits: [
        { account: 'License Revenue', amount: period.revenue_recognized }
      ]
    });

    if (period.interest_income > 0) {
      entries.push({
        entry_num: entries.length + 1,
        date: new Date(period.end_date),
        description: `Period ${period.period} - Interest Income on License`,
        debits: [
          { account: 'Contract Liability - Financing', amount: period.interest_income }
        ],
        credits: [
          { account: 'Interest Income', amount: period.interest_income }
        ]
      });
    }
  });

  return entries;
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

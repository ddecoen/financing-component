// Test the monthly PV calculation
const discountRate = 0.06;
const monthlyRate = Math.pow(1 + discountRate, 1/12) - 1;
const statedTotal = 2100000;
const licensePct = 0.20;
const supportPct = 0.80;

// License: delivered at t=0
const licensePV = statedTotal * licensePct;  // $420,000

// Support: delivered monthly
const monthlySupportStated = (statedTotal * supportPct) / 60;  // $28,000/month
let supportPV = 0;

for (let month = 1; month <= 60; month++) {
  const pv = monthlySupportStated / Math.pow(1 + monthlyRate, month);
  supportPV += pv;
}

const totalPV = licensePV + supportPV;
const discount = statedTotal - totalPV;

console.log("Monthly Rate:", monthlyRate);
console.log("License PV:", licensePV);
console.log("Support PV:", supportPV);
console.log("Total PV:", totalPV);
console.log("Discount (SFC):", discount);
console.log("Opening Net (after license):", totalPV - licensePV * 1.0);

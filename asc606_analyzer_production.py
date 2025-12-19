#!/usr/bin/env python3
"""
ASC 606 Significant Financing Component Analyzer
Coder Technologies Inc.

Production-ready tool for analyzing multi-year contracts with up-front payments.
Calculates present value, allocates to performance obligations, and generates
journal entries using effective interest method.

Author: Dan deCoen, Controller
Date: December 2025
"""

import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional
import json


class ASC606FinancingAnalyzer:
    """
    Analyzes contracts for significant financing components per ASC 606-10-32-15
    
    Usage:
        analyzer = ASC606FinancingAnalyzer(
            contract_data={
                'customer': 'Deka Bank',
                'cash_received': 2_100_000,
                'payment_date': '2025-12-31',
                'periods': [
                    {'start': '2025-12-31', 'end': '2026-12-30', 'stated_amount': 420_000},
                    {'start': '2026-12-31', 'end': '2027-12-30', 'stated_amount': 420_000},
                    # ... etc
                ]
            },
            discount_rate=0.06,
            license_pct=0.20
        )
        
        results = analyzer.analyze()
        analyzer.export_to_excel('output.xlsx')
        analyzer.export_journal_entries('journal_entries.csv')
    """
    
    def __init__(self, contract_data: Dict, discount_rate: float = 0.06, license_pct: float = 0.20, override_pv: Optional[float] = None, use_integer_years: bool = True):
        """
        Initialize analyzer
        
        Args:
            contract_data: Dictionary containing contract details
            discount_rate: Annual discount rate (default 6%)
            license_pct: Percentage allocated to license (default 20%)
            override_pv: Optional - directly specify PV instead of calculating
            use_integer_years: If True, use 1, 2, 3... years instead of exact day count
        """
        self.contract_data = contract_data
        self.discount_rate = discount_rate
        self.license_pct = license_pct
        self.support_pct = 1 - license_pct
        self.override_pv = override_pv
        self.use_integer_years = use_integer_years
        
        # Parse dates
        self.payment_date = self._parse_date(contract_data['payment_date'])
        
        # Parse periods
        self.periods = []
        for p in contract_data['periods']:
            self.periods.append({
                'start': self._parse_date(p['start']),
                'end': self._parse_date(p['end']),
                'stated_amount': p['stated_amount']
            })
        
        self.results = {}
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime"""
        return datetime.strptime(date_str, '%Y-%m-%d')
    
    def calculate_present_value(self) -> Dict:
        """Calculate PV of each period and total financing component"""
        pv_analysis = []
        
        for i, period in enumerate(self.periods, 1):
            # Determine discount period
            if self.use_integer_years:
                # Use integer years (1, 2, 3, 4, 5...) for cleaner calculation
                years_diff = float(i)
            else:
                # Calculate exact time from payment to END of service period
                days_diff = (period['end'] - self.payment_date).days
                years_diff = days_diff / 365.25
            
            # Present value calculation
            stated = period['stated_amount']
            pv = stated / ((1 + self.discount_rate) ** years_diff)
            financing = stated - pv
            
            # Calculate midpoint for reference
            service_midpoint = period['start'] + (period['end'] - period['start']) / 2
            
            pv_analysis.append({
                'period': i,
                'start': period['start'],
                'end': period['end'],
                'service_midpoint': service_midpoint,
                'years_from_payment': years_diff,
                'stated_amount': stated,
                'present_value': pv,
                'financing_component': financing
            })
        
        # Calculate totals
        total_stated = sum(p['stated_amount'] for p in pv_analysis)
        total_pv = sum(p['present_value'] for p in pv_analysis)
        total_financing = sum(p['financing_component'] for p in pv_analysis)
        
        self.results['pv_analysis'] = pv_analysis
        self.results['total_stated'] = total_stated
        self.results['total_pv'] = total_pv
        self.results['financing_component'] = total_financing
        self.results['financing_pct'] = (total_financing / total_stated) * 100
        
        return self.results
    
    def allocate_transaction_price(self):
        """Allocate adjusted transaction price to license and support"""
        if 'total_pv' not in self.results:
            if self.override_pv:
                # Use provided PV instead of calculating
                self.results['total_pv'] = self.override_pv
                self.results['financing_component'] = self.contract_data['cash_received'] - self.override_pv
                self.results['financing_pct'] = (self.results['financing_component'] / self.contract_data['cash_received']) * 100
            else:
                # Calculate PV
                self.calculate_present_value()
        
        total_pv = self.results['total_pv']
        
        self.results['license_revenue'] = total_pv * self.license_pct
        self.results['support_total'] = total_pv * self.support_pct
        self.results['annual_support'] = self.results['support_total'] / len(self.periods)
    
    def build_amortization_schedule(self) -> List[Dict]:
        """Build effective interest amortization schedule"""
        if 'license_revenue' not in self.results:
            self.allocate_transaction_price()
        
        cash_received = self.contract_data['cash_received']
        license_revenue = self.results['license_revenue']
        annual_support = self.results['annual_support']
        financing_component = self.results['financing_component']
        
        schedule = []
        
        # License delivery
        opening = cash_received
        revenue = license_revenue
        interest = 0
        ending = opening - revenue
        
        schedule.append({
            'period': 'License Delivery',
            'date': self.payment_date,
            'opening_liability': opening,
            'interest_income': interest,
            'revenue_recognized': revenue,
            'ending_liability': ending
        })
        
        # Calculate opening balances for interest allocation
        opening_balances = []
        current = ending
        
        for _ in range(len(self.periods)):
            opening_balances.append(current)
            current = current - annual_support
        
        # Allocate interest proportionally
        total_weighted = sum(opening_balances)
        interest_by_year = [
            financing_component * (bal / total_weighted)
            for bal in opening_balances
        ]
        
        # Build years 1-N
        opening = ending
        for i, period in enumerate(self.periods):
            interest = interest_by_year[i]
            revenue = annual_support
            ending = opening + interest - revenue
            
            schedule.append({
                'period': f'Year {i+1}',
                'date': period['end'],
                'opening_liability': opening,
                'interest_income': interest,
                'revenue_recognized': revenue,
                'ending_liability': ending
            })
            
            opening = ending
        
        self.results['amortization_schedule'] = schedule
        return schedule
    
    def generate_journal_entries(self) -> List[Dict]:
        """Generate complete journal entries"""
        if 'amortization_schedule' not in self.results:
            self.build_amortization_schedule()
        
        schedule = self.results['amortization_schedule']
        cash_received = self.contract_data['cash_received']
        
        entries = []
        
        # Entry 1: Initial cash receipt
        entries.append({
            'entry_num': 1,
            'date': self.payment_date,
            'description': 'Initial cash receipt',
            'debits': [{'account': 'Cash', 'amount': cash_received}],
            'credits': [{'account': 'Contract Liability', 'amount': cash_received}]
        })
        
        # Entry 2: License revenue
        license_row = schedule[0]
        entries.append({
            'entry_num': 2,
            'date': license_row['date'],
            'description': 'License revenue recognition (point in time)',
            'debits': [{'account': 'Contract Liability', 'amount': license_row['revenue_recognized']}],
            'credits': [{'account': 'License Revenue', 'amount': license_row['revenue_recognized']}]
        })
        
        # Entries 3+: Annual support and interest
        entry_num = 3
        for i in range(1, len(schedule)):
            row = schedule[i]
            
            # Interest income
            entries.append({
                'entry_num': entry_num,
                'date': row['date'],
                'description': f'Interest income - Year {i}',
                'debits': [{'account': 'Contract Liability', 'amount': row['interest_income']}],
                'credits': [{'account': 'Interest Income', 'amount': row['interest_income']}]
            })
            entry_num += 1
            
            # Support revenue
            entries.append({
                'entry_num': entry_num,
                'date': row['date'],
                'description': f'Support revenue - Year {i}',
                'debits': [{'account': 'Contract Liability', 'amount': row['revenue_recognized']}],
                'credits': [{'account': 'Support Revenue', 'amount': row['revenue_recognized']}]
            })
            entry_num += 1
        
        self.results['journal_entries'] = entries
        return entries
    
    def analyze(self) -> Dict:
        """Run complete analysis"""
        # If override PV provided, use it directly
        if self.override_pv:
            self.results['total_pv'] = self.override_pv
            self.results['financing_component'] = self.contract_data['cash_received'] - self.override_pv
            self.results['financing_pct'] = (self.results['financing_component'] / self.contract_data['cash_received']) * 100
        else:
            self.calculate_present_value()
        
        self.allocate_transaction_price()
        self.build_amortization_schedule()
        self.generate_journal_entries()
        
        # Add summary
        self.results['summary'] = {
            'customer': self.contract_data['customer'],
            'cash_received': self.contract_data['cash_received'],
            'transaction_price': self.results['total_pv'],
            'financing_component': self.results['financing_component'],
            'financing_pct': self.results['financing_pct'],
            'discount_rate': self.discount_rate,
            'license_pct': self.license_pct * 100,
            'support_pct': self.support_pct * 100
        }
        
        return self.results
    
    def print_summary(self):
        """Print comprehensive summary"""
        if 'summary' not in self.results:
            self.analyze()
        
        s = self.results['summary']
        
        print("=" * 90)
        print(f"ASC 606 ANALYSIS - {s['customer'].upper()}")
        print("=" * 90)
        
        print(f"\nCash Received:           ${s['cash_received']:,.2f}")
        print(f"Transaction Price (PV):  ${s['transaction_price']:,.2f}")
        print(f"Financing Component:     ${s['financing_component']:,.2f} ({s['financing_pct']:.2f}%)")
        print(f"\nDiscount Rate:           {s['discount_rate']*100:.1f}%")
        print(f"License Allocation:      {s['license_pct']:.0f}%")
        print(f"Support Allocation:      {s['support_pct']:.0f}%")
        
        # Amortization schedule
        print(f"\n{'='*90}")
        print("AMORTIZATION SCHEDULE")
        print(f"{'='*90}\n")
        
        schedule = self.results['amortization_schedule']
        
        print(f"{'Period':<20} {'Opening':<15} {'Interest':<15} {'Revenue':<15} {'Ending':<15}")
        print("─" * 80)
        
        total_interest = 0
        total_revenue = 0
        
        for row in schedule:
            print(f"{row['period']:<20} ${row['opening_liability']:>13,.0f} "
                  f"${row['interest_income']:>13,.0f} ${row['revenue_recognized']:>13,.0f} "
                  f"${row['ending_liability']:>13,.0f}")
            total_interest += row['interest_income']
            total_revenue += row['revenue_recognized']
        
        print("─" * 80)
        print(f"{'TOTALS':<20}                   ${total_interest:>13,.0f} ${total_revenue:>13,.0f}")
        
        # Reconciliation
        print(f"\n{'='*90}")
        print("RECONCILIATION")
        print(f"{'='*90}")
        print(f"Cash Received:           ${s['cash_received']:,.2f}")
        print(f"Total Revenue:           ${total_revenue:,.2f}")
        print(f"Total Interest:          ${total_interest:,.2f}")
        print(f"{'─'*90}")
        print(f"Sum:                     ${total_revenue + total_interest:,.2f}")
        
        diff = abs(s['cash_received'] - (total_revenue + total_interest))
        if diff < 1:
            print("\n✅ Perfect reconciliation!")
        else:
            print(f"\n⚠️  Difference: ${diff:,.2f}")
    
    def export_to_excel(self, filename: str):
        """Export complete analysis to Excel"""
        if 'amortization_schedule' not in self.results:
            self.analyze()
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # Summary sheet
            summary = self.results['summary']
            summary_data = {
                'Metric': [
                    'Customer',
                    'Cash Received',
                    'Transaction Price (PV)',
                    'Financing Component',
                    'Financing %',
                    'Discount Rate',
                    'License Allocation %',
                    'Support Allocation %'
                ],
                'Value': [
                    summary['customer'],
                    f"${summary['cash_received']:,.2f}",
                    f"${summary['transaction_price']:,.2f}",
                    f"${summary['financing_component']:,.2f}",
                    f"{summary['financing_pct']:.2f}%",
                    f"{summary['discount_rate']*100:.1f}%",
                    f"{summary['license_pct']:.0f}%",
                    f"{summary['support_pct']:.0f}%"
                ]
            }
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
            
            # Amortization schedule
            schedule_data = []
            for row in self.results['amortization_schedule']:
                schedule_data.append({
                    'Period': row['period'],
                    'Date': row['date'].strftime('%Y-%m-%d'),
                    'Opening Liability': row['opening_liability'],
                    'Interest Income': row['interest_income'],
                    'Revenue Recognized': row['revenue_recognized'],
                    'Ending Liability': row['ending_liability']
                })
            df_schedule = pd.DataFrame(schedule_data)
            df_schedule.to_excel(writer, sheet_name='Amortization Schedule', index=False)
            
            # Journal entries
            je_data = []
            for entry in self.results['journal_entries']:
                je_data.append({
                    'Entry #': entry['entry_num'],
                    'Date': entry['date'].strftime('%Y-%m-%d'),
                    'Description': entry['description'],
                    'Account': '',
                    'Debit': '',
                    'Credit': ''
                })
                
                for debit in entry['debits']:
                    je_data.append({
                        'Entry #': '', 'Date': '', 'Description': '',
                        'Account': debit['account'],
                        'Debit': debit['amount'],
                        'Credit': ''
                    })
                
                for credit in entry['credits']:
                    je_data.append({
                        'Entry #': '', 'Date': '', 'Description': '',
                        'Account': credit['account'],
                        'Debit': '',
                        'Credit': credit['amount']
                    })
                
                je_data.append({'Entry #': '', 'Date': '', 'Description': '', 'Account': '', 'Debit': '', 'Credit': ''})
            
            df_je = pd.DataFrame(je_data)
            df_je.to_excel(writer, sheet_name='Journal Entries', index=False)
        
        print(f"\n✓ Exported to: {filename}")
    
    def export_journal_entries_csv(self, filename: str):
        """Export journal entries in CSV format for NetSuite import"""
        if 'journal_entries' not in self.results:
            self.analyze()
        
        csv_data = []
        
        for entry in self.results['journal_entries']:
            date_str = entry['date'].strftime('%m/%d/%Y')
            
            for debit in entry['debits']:
                csv_data.append({
                    'Date': date_str,
                    'Account': debit['account'],
                    'Debit': debit['amount'],
                    'Credit': '',
                    'Memo': entry['description']
                })
            
            for credit in entry['credits']:
                csv_data.append({
                    'Date': date_str,
                    'Account': credit['account'],
                    'Debit': '',
                    'Credit': credit['amount'],
                    'Memo': entry['description']
                })
        
        df = pd.DataFrame(csv_data)
        df.to_csv(filename, index=False)
        
        print(f"✓ Exported journal entries to: {filename}")
    
    def export_to_excel_buffer(self, buffer):
        """Export analysis to Excel file in a BytesIO buffer for web API"""
        if not self.results:
            self.analyze()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Summary sheet
            summary_data = {
                'Metric': [
                    'Customer',
                    'Cash Received',
                    'Stated Contract Value',
                    'Present Value',
                    'Financing Component',
                    'Financing %',
                    '',
                    'License Allocation %',
                    'License Revenue',
                    'License Financing',
                    '',
                    'Support Allocation %',
                    'Support Revenue',
                    'Support Financing',
                    '',
                    'Discount Rate',
                    'Is Significant?'
                ],
                'Value': [
                    self.contract_data['customer'],
                    self.contract_data['cash_received'],
                    self.results['stated_total'],
                    self.results['present_value'],
                    self.results['financing_component'],
                    f"{self.results['financing_percentage']:.2%}",
                    '',
                    f"{self.license_pct:.0%}",
                    self.results['license_revenue'],
                    self.results['license_financing'],
                    '',
                    f"{self.support_pct:.0%}",
                    self.results['support_revenue'],
                    self.results['support_financing'],
                    '',
                    f"{self.discount_rate:.1%}",
                    'YES' if self.results['is_significant'] else 'NO'
                ]
            }
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
            
            # PV Analysis
            df_pv = pd.DataFrame(self.results['pv_analysis'])
            df_pv.to_excel(writer, sheet_name='PV Analysis', index=False)
            
            # License Schedule
            df_lic = pd.DataFrame(self.results['license_schedule'])
            df_lic.to_excel(writer, sheet_name='License Schedule', index=False)
            
            # Support Schedule
            df_sup = pd.DataFrame(self.results['support_schedule'])
            df_sup.to_excel(writer, sheet_name='Support Schedule', index=False)
            
            # Journal Entries
            je_data = []
            for entry in self.results['journal_entries']:
                je_data.append({
                    'Entry #': entry['entry_num'],
                    'Date': entry['date'].strftime('%Y-%m-%d'),
                    'Description': entry['description'],
                    'Account': '',
                    'Debit': '',
                    'Credit': ''
                })
                
                for debit in entry['debits']:
                    je_data.append({
                        'Entry #': '', 'Date': '', 'Description': '',
                        'Account': debit['account'],
                        'Debit': debit['amount'],
                        'Credit': ''
                    })
                
                for credit in entry['credits']:
                    je_data.append({
                        'Entry #': '', 'Date': '', 'Description': '',
                        'Account': credit['account'],
                        'Debit': '',
                        'Credit': credit['amount']
                    })
                
                je_data.append({'Entry #': '', 'Date': '', 'Description': '', 'Account': '', 'Debit': '', 'Credit': ''})
            
            df_je = pd.DataFrame(je_data)
            df_je.to_excel(writer, sheet_name='Journal Entries', index=False)
    
    def export_journal_entries_buffer(self, buffer):
        """Export journal entries to CSV buffer for web API"""
        if 'journal_entries' not in self.results:
            self.analyze()
        
        csv_data = []
        
        for entry in self.results['journal_entries']:
            date_str = entry['date'].strftime('%m/%d/%Y')
            
            for debit in entry['debits']:
                csv_data.append({
                    'Date': date_str,
                    'Account': debit['account'],
                    'Debit': debit['amount'],
                    'Credit': '',
                    'Memo': entry['description']
                })
            
            for credit in entry['credits']:
                csv_data.append({
                    'Date': date_str,
                    'Account': credit['account'],
                    'Debit': '',
                    'Credit': credit['amount'],
                    'Memo': entry['description']
                })
        
        df = pd.DataFrame(csv_data)
        df.to_csv(buffer, index=False)


def analyze_deka_bank():
    """Example: Analyze Deka Bank contract"""
    
    contract_data = {
        'customer': 'Deka Bank',
        'cash_received': 2_100_000,
        'payment_date': '2025-12-31',
        'periods': [
            {'start': '2025-12-31', 'end': '2026-12-30', 'stated_amount': 420_000},
            {'start': '2026-12-31', 'end': '2027-12-30', 'stated_amount': 420_000},
            {'start': '2027-12-31', 'end': '2028-12-30', 'stated_amount': 420_000},
            {'start': '2028-12-31', 'end': '2029-12-30', 'stated_amount': 420_000},
            {'start': '2029-12-31', 'end': '2030-12-30', 'stated_amount': 420_000}
        ]
    }
    
    # Now calculates correct PV automatically (discounts to END of each period)
    analyzer = ASC606FinancingAnalyzer(
        contract_data=contract_data,
        discount_rate=0.06,
        license_pct=0.20
    )
    
    analyzer.analyze()
    analyzer.print_summary()
    analyzer.export_to_excel('Deka_Bank_ASC606.xlsx')
    analyzer.export_journal_entries_csv('Deka_Bank_Journal_Entries.csv')
    
    return analyzer


if __name__ == "__main__":
    analyzer = analyze_deka_bank()

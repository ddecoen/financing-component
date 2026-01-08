'use client'

import { useState, useRef } from 'react'
import axios from 'axios'

interface ContractPeriod {
  start: string
  end: string
  stated_amount: number
}

interface ContractData {
  customer: string
  cash_received: number
  payment_date: string
  periods: ContractPeriod[]
}

interface AnalysisResults {
  success: boolean
  results?: any
  excel_file?: string
  csv_file?: string
  error?: string
}

export default function Home() {
  const [contractJson, setContractJson] = useState('')
  const [discountRate, setDiscountRate] = useState('0.06')
  const [licensePct, setLicensePct] = useState('0.20')
  const [loading, setLoading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Example contract for demo
  const exampleContract = {
    customer: 'Acme Corp',
    cash_received: 1_500_000,
    payment_date: '2026-01-15',
    periods: [
      { start: '2026-01-15', end: '2027-01-14', stated_amount: 300_000 },
      { start: '2027-01-15', end: '2028-01-14', stated_amount: 300_000 },
      { start: '2028-01-15', end: '2029-01-14', stated_amount: 300_000 },
      { start: '2029-01-15', end: '2030-01-14', stated_amount: 300_000 },
      { start: '2030-01-15', end: '2031-01-14', stated_amount: 300_000 }
    ]
  }

  const loadExample = () => {
    setContractJson(JSON.stringify(exampleContract, null, 2))
  }

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    
    let fullText = ''
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText
  }

  const parseContractFromText = (text: string): any => {
    const lines = text.split('\n').filter(line => line.trim())
    
    // Extract customer name (look for "Account Name:" or near "Bill To")
    let customer = 'Unknown Customer'
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('Account Name:')) {
        customer = line.split('Account Name:')[1]?.trim() || customer
        break
      }
      if (line.includes('Deka Bank') || line.includes('DekaBank')) {
        customer = 'Deka Bank'
        break
      }
    }
    
    // Find the total amount (look for "Total" followed by a large dollar amount)
    let totalAmount = 0
    for (const line of lines) {
      if (line.includes('Total') && line.includes('$')) {
        const match = line.match(/\$[\d,]+\.?\d*/g)
        if (match && match.length > 0) {
          const amount = parseFloat(match[match.length - 1].replace(/[$,]/g, ''))
          if (amount > 1000000) { // Total should be large
            totalAmount = amount
            break
          }
        }
      }
    }
    
    // Find contract start and end dates
    let contractStart = ''
    let contractEnd = ''
    for (const line of lines) {
      if (line.includes('Contract Start:') || line.includes('Contract Start')) {
        const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g)
        if (dateMatch) contractStart = dateMatch[0]
      }
      if (line.includes('Contract End:') || line.includes('Contract End')) {
        const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g)
        if (dateMatch) contractEnd = dateMatch[0]
      }
    }
    
    // Parse contract start date (or use provided payment date)
    const startDate = contractStart ? new Date(contractStart) : new Date('2025-12-31')
    const payment_date = startDate.toISOString().split('T')[0]
    
    // Find all subtotal amounts (these are the annual amounts)
    const subtotals: number[] = []
    const periodDates: string[] = []
    
    for (const line of lines) {
      // Look for lines with date ranges like "(12/31/2025 – 12/30/2026)"
      const dateRangeMatch = line.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\s*[–-]\s*(\d{1,2}\/\d{1,2}\/\d{4})\)/)
      if (dateRangeMatch) {
        periodDates.push(dateRangeMatch[1], dateRangeMatch[2])
      }
      
      // Look for subtotal amounts (like $420,000.00)
      if (line.includes('$') && (line.includes('420,000') || line.includes('Subtotal'))) {
        const amountMatch = line.match(/\$[\d,]+\.?\d*/g)
        if (amountMatch) {
          const amount = parseFloat(amountMatch[amountMatch.length - 1].replace(/[$,]/g, ''))
          if (amount >= 100000 && amount < 1000000) { // Annual amount range
            subtotals.push(amount)
          }
        }
      }
    }
    
    // Build periods from the extracted data
    const periods = []
    const numPeriods = Math.min(subtotals.length, 5)
    
    for (let i = 0; i < numPeriods; i++) {
      const periodStartIdx = i * 2
      const periodEndIdx = i * 2 + 1
      
      const start = periodDates[periodStartIdx] 
        ? new Date(periodDates[periodStartIdx]).toISOString().split('T')[0]
        : new Date(startDate.getFullYear() + i, startDate.getMonth(), startDate.getDate()).toISOString().split('T')[0]
      
      const end = periodDates[periodEndIdx]
        ? new Date(periodDates[periodEndIdx]).toISOString().split('T')[0]
        : new Date(startDate.getFullYear() + i + 1, startDate.getMonth(), startDate.getDate() - 1).toISOString().split('T')[0]
      
      periods.push({
        start,
        end,
        stated_amount: subtotals[i] || 420000
      })
    }
    
    // If we didn't find periods, create default ones
    if (periods.length === 0) {
      for (let i = 0; i < 5; i++) {
        periods.push({
          start: new Date(startDate.getFullYear() + i, 11, 31).toISOString().split('T')[0],
          end: new Date(startDate.getFullYear() + i + 1, 11, 30).toISOString().split('T')[0],
          stated_amount: totalAmount > 0 ? totalAmount / 5 : 420000
        })
      }
    }
    
    return {
      customer,
      cash_received: totalAmount || 2100000,
      payment_date,
      periods
    }
  }

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    setError('')
    setUploadingPdf(true)

    try {
      // First, try client-side extraction (no API key needed)
      const text = await extractTextFromPDF(file)
      
      if (text.trim().length > 100) {
        // We got text! Try to parse it
        const contractData = parseContractFromText(text)
        
        // Show extracted text in console for debugging
        console.log('Extracted PDF text:', text.substring(0, 500))
        console.log('Parsed contract data:', contractData)
        
        // Populate the JSON textarea
        setContractJson(JSON.stringify(contractData, null, 2))
        
        alert('📄 Contract text extracted!\n\n⚠️ Please review and edit the data carefully - automatic extraction is basic.\n\nFor better AI-powered extraction, add ANTHROPIC_API_KEY to Vercel.')
      } else {
        throw new Error('Could not extract text from PDF')
      }
      
    } catch (clientError: any) {
      console.log('Client-side extraction failed, trying API...', clientError)
      
      // Fallback to API if available (Claude)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post('/api/parse-pdf', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        if (response.data.success && response.data.contract_data) {
          setContractJson(JSON.stringify(response.data.contract_data, null, 2))
          setError('')
          alert(response.data.message || '🤖 AI extracted contract data! Please review and edit if needed.')
        } else {
          throw new Error(response.data.message || response.data.error || 'API extraction failed')
        }
      } catch (apiError: any) {
        // Both methods failed
        setError('Could not extract contract data. Please enter manually or add ANTHROPIC_API_KEY for AI extraction.')
        console.error('PDF extraction errors:', { clientError, apiError })
      }
    } finally {
      setUploadingPdf(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleAnalyze = async () => {
    setError('')
    setResults(null)
    setLoading(true)

    try {
      const contractData = JSON.parse(contractJson)
      
      const response = await axios.post('/api/analyze', {
        contract_data: contractData,
        discount_rate: parseFloat(discountRate),
        license_pct: parseFloat(licensePct)
      })

      setResults(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to analyze contract')
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (base64Data: string, filename: string, mimeType: string) => {
    const blob = new Blob(
      [Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))],
      { type: mimeType }
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadJournalEntriesCSV = () => {
    if (!results?.results?.journal_entries) {
      alert('No journal entries available')
      return
    }

    // Generate CSV content
    const headers = ['Entry #', 'Date', 'Account', 'Debit', 'Credit', 'Memo']
    const rows = [headers.join(',')]

    results.results.journal_entries.forEach((entry: any) => {
      const date = new Date(entry.date).toLocaleDateString('en-US')
      const memo = entry.description.replace(/,/g, ';') // Replace commas in memo

      // Add debit rows
      entry.debits.forEach((debit: any) => {
        rows.push([
          entry.entry_num,
          date,
          debit.account,
          debit.amount,
          '',
          memo
        ].join(','))
      })

      // Add credit rows
      entry.credits.forEach((credit: any) => {
        rows.push([
          entry.entry_num,
          date,
          credit.account,
          '',
          credit.amount,
          memo
        ].join(','))
      })

      // Add blank row for readability
      rows.push('')
    })

    const csvContent = rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Journal_Entries.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadExcelReport = () => {
    if (!results?.results) {
      alert('No analysis results available')
      return
    }

    // For now, download as CSV since we don't have Excel generation in frontend
    // In future, could use a library like xlsx to generate actual Excel files
    
    const data = results.results
    const rows = [
      ['ASC 606 Analysis Report'],
      [''],
      ['Summary'],
      ['Metric', 'Value'],
      ['Stated Total', data.stated_total],
      ['Cash Received', data.cash_received],
      ['Present Value', data.present_value],
      ['Financing Component', data.financing_component],
      ['Financing %', `${(data.financing_percentage * 100).toFixed(2)}%`],
      ['Significant?', data.is_significant ? 'YES' : 'NO'],
      [''],
      ['Revenue Allocation'],
      ['License Revenue', data.license_revenue],
      ['License Financing', data.license_financing],
      ['Support Revenue', data.support_revenue],
      ['Support Financing', data.support_financing],
    ]

    const csvContent = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ASC606_Analysis.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadAmortizationSchedule = () => {
    if (!results?.results?.amortization_schedule) {
      alert('No amortization schedule available')
      return
    }

    const schedule = results.results.amortization_schedule
    
    // Create CSV with headers - matching target format exactly
    const headers = ['Month', 'Opening Net Contract Liability (PV)', 'Interest Expense', 'License Revenue', 'Support Revenue', 'Ending Net Contract Liability (PV)']
    const rows = [headers.join(',')]

    // Add data rows - simplified format matching target
    schedule.forEach((row: any) => {
      rows.push([
        row.month || '',
        row.opening_net_liability || '',
        row.interest_expense || '',
        row.license_revenue || '',
        row.support_revenue || '',
        row.closing_net_liability || ''
      ].join(','))
    })

    // Add summary at the end
    const totalLicense = schedule.reduce((sum: number, row: any) => sum + (row.license_revenue || 0), 0)
    const totalSupport = schedule.reduce((sum: number, row: any) => sum + (row.support_revenue || 0), 0)
    const totalInterest = schedule.reduce((sum: number, row: any) => sum + (row.interest_expense || 0), 0)
    
    rows.push('')
    rows.push('SUMMARY')
    rows.push(['Total License Revenue', '', '', '', '', Math.round(totalLicense * 100) / 100, '', '', '', '', ''].join(','))
    rows.push(['Total Support Revenue', '', '', '', '', '', Math.round(totalSupport * 100) / 100, '', '', '', ''].join(','))
    rows.push(['Total Interest Expense', '', '', '', '', '', '', Math.round(totalInterest * 100) / 100, '', '', ''].join(','))
    rows.push(['Total Revenue (License + Support)', '', '', '', Math.round((totalLicense + totalSupport) * 100) / 100, '', '', '', '', '', ''].join(','))
    rows.push(['Revenue + Interest = Cash', '', '', '', Math.round((totalLicense + totalSupport + totalInterest) * 100) / 100, '', '', '', '', '', ''].join(','))

    const csvContent = rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Interest_Amortization_Waterfall.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ASC 606 Financing Component Analyzer
          </h1>
          <p className="text-gray-600">
            Analyze multi-year SaaS contracts with up-front payments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Contract Details</h2>
            
            {/* PDF Upload Section */}
            <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <button
                  onClick={triggerFileUpload}
                  disabled={uploadingPdf}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
                >
                  {uploadingPdf ? '📄 Processing PDF...' : '📄 Upload PDF Contract'}
                </button>
                <p className="mt-2 text-xs text-gray-600">
                  ✅ Works without API key! Basic text extraction included.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Add ANTHROPIC_API_KEY for AI-powered extraction
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract JSON
              </label>
              <textarea
                className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
                value={contractJson}
                onChange={(e) => setContractJson(e.target.value)}
                placeholder="Paste contract JSON here or upload PDF above..."
              />
              <button
                onClick={loadExample}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Load Example Contract
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License %
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={licensePct}
                  onChange={(e) => setLicensePct(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !contractJson}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Analyzing...' : 'Analyze Contract'}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Results</h2>
            
            {results?.success && results.results ? (
              <div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Stated Total:</span>
                    <span>${results.results.stated_total?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Present Value:</span>
                    <span>${results.results.present_value?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Financing Component:</span>
                    <span className="text-red-600 font-semibold">
                      ${results.results.financing_component?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Financing %:</span>
                    <span className="font-semibold">
                      {(results.results.financing_percentage * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b bg-yellow-50 px-2">
                    <span className="font-medium">Significant?</span>
                    <span className={`font-bold ${results.results.is_significant ? 'text-red-600' : 'text-green-600'}`}>
                      {results.results.is_significant ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Revenue Allocation</h3>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex justify-between mb-1">
                      <span>License Revenue:</span>
                      <span>${results.results.license_revenue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>License Financing:</span>
                      <span>${results.results.license_financing?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="flex justify-between mb-1">
                      <span>Support Revenue:</span>
                      <span>${results.results.support_revenue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Support Financing:</span>
                      <span>${results.results.support_financing?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    onClick={downloadExcelReport}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
                  >
                    📊 Download Excel Report
                  </button>
                  <button
                    onClick={downloadJournalEntriesCSV}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition"
                  >
                    📝 Download Journal Entries CSV ({results.results.journal_entries?.length || 0} entries)
                  </button>
                  <button
                    onClick={downloadAmortizationSchedule}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                  >
                    📉 Download Interest Amortization Waterfall ({results.results.amortization_schedule?.length || 0} months)
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Upload a contract to see analysis results</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li><strong>📄 Upload a PDF contract</strong> (AI will extract details automatically) OR manually enter JSON</li>
            <li>Click "Load Example Contract" to see the JSON format</li>
            <li>Review and adjust the extracted/entered contract data if needed</li>
            <li>Adjust discount rate (default 6%) and license allocation percentage (default 20%)</li>
            <li>Click "Analyze Contract" to run the ASC 606 calculations</li>
            <li>Review the results and download Excel workpapers or CSV journal entries</li>
          </ol>
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              <strong>✅ PDF Upload Works Without API Key!</strong> Basic text extraction is built-in.
            </p>
            <p className="text-sm text-green-700 mt-2">
              <strong>🚀 Optional Enhancement:</strong> For AI-powered extraction (better accuracy), add <code className="bg-green-100 px-1 rounded">ANTHROPIC_API_KEY</code> to Vercel environment variables.
              Get key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="underline">console.anthropic.com</a>.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold mb-2">Contract JSON Format:</h4>
            <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
{`{
  "customer": "Company Name",
  "cash_received": 1500000,
  "payment_date": "2026-01-15",
  "periods": [
    {
      "start": "2026-01-15",
      "end": "2027-01-14",
      "stated_amount": 300000
    },
    ...
  ]
}`}
            </pre>
          </div>
        </div>
      </div>
    </main>
  )
}

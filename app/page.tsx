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
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/parse-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success && response.data.contract_data) {
        // Populate the JSON textarea with extracted data
        setContractJson(JSON.stringify(response.data.contract_data, null, 2))
        setError('')
        alert(response.data.message || 'Contract extracted! Please review and edit if needed.')
      } else {
        setError(response.data.message || response.data.error || 'Failed to extract contract data')
        if (response.data.rawText) {
          console.log('Raw AI response:', response.data.rawText)
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to process PDF'
      setError(errorMsg)
      console.error('PDF upload error:', err)
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
                  AI will extract contract details automatically
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
                    onClick={() => downloadFile(results.excel_file!, 'ASC606_Analysis.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
                  >
                    📊 Download Excel Report
                  </button>
                  <button
                    onClick={() => downloadFile(results.csv_file!, 'Journal_Entries.csv', 'text/csv')}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition"
                  >
                    📝 Download Journal Entries CSV
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
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>⚙️ Setup Required for PDF Upload:</strong> Add your Anthropic Claude API key to Vercel environment variables 
              (Settings → Environment Variables → <code className="bg-yellow-100 px-1 rounded">ANTHROPIC_API_KEY</code>). 
              Get your key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="underline">console.anthropic.com</a>.
              Without this, you can still use manual JSON entry.
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

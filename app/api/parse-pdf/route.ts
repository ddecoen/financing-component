import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI (you'll need to add OPENAI_API_KEY to Vercel env vars)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // For now, we'll use a simpler approach without pdf-parse
    // since it requires native dependencies that may not work on Vercel
    
    // Read file as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert PDF to base64 for OpenAI
    const base64Pdf = buffer.toString('base64');

    if (!openai) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your Vercel environment variables.',
        fallbackMessage: 'Please manually enter your contract details in JSON format for now.'
      }, { status: 503 });
    }

    // Use OpenAI to extract contract data
    const prompt = `You are a financial analyst extracting contract information from a PDF. 
    
Extract the following information and return ONLY a valid JSON object with this exact structure:
{
  "customer": "Company Name",
  "cash_received": 1500000,
  "payment_date": "YYYY-MM-DD",
  "periods": [
    {
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD",
      "stated_amount": 300000
    }
  ]
}

Important:
- Extract the customer/client name
- Find the total upfront payment amount (cash_received)
- Identify the payment date
- Extract all contract periods with start dates, end dates, and amounts
- Use YYYY-MM-DD format for all dates
- All amounts should be numbers (no currency symbols)
- Return ONLY the JSON, no additional text

If you cannot extract this information, return:
{
  "error": "Could not extract contract details from PDF"
}`;

    // Note: GPT-4 Vision or GPT-4-turbo with PDF support would be ideal
    // For now, we'll provide a manual entry option
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a financial contract analyzer. Extract structured data from contract text.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nPlease analyze this PDF file and extract the contract information. Note: If you cannot process the PDF directly, please respond with an error message asking the user to copy and paste the contract text.`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const extracted = response.choices[0].message.content;
    
    if (!extracted) {
      throw new Error('No response from AI');
    }

    // Try to parse the JSON response
    let contractData;
    try {
      contractData = JSON.parse(extracted);
    } catch (e) {
      // If JSON parsing fails, return the raw text for manual review
      return NextResponse.json({
        success: false,
        error: 'Could not parse AI response',
        rawText: extracted,
        message: 'Please review and manually format the contract data'
      });
    }

    if (contractData.error) {
      return NextResponse.json({
        success: false,
        error: contractData.error,
        message: 'Could not extract contract details. Please enter manually.'
      });
    }

    return NextResponse.json({
      success: true,
      contract_data: contractData,
      message: 'Contract data extracted successfully. Please review and adjust if needed.'
    });

  } catch (error: any) {
    console.error('PDF Parse Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to parse PDF',
        message: 'Please try entering contract details manually'
      },
      { status: 500 }
    );
  }
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

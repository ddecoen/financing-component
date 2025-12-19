import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude (you'll need to add ANTHROPIC_API_KEY to Vercel env vars)
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

    // Convert PDF to base64 for Claude
    const base64Pdf = buffer.toString('base64');

    if (!anthropic) {
      return NextResponse.json({
        success: false,
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your Vercel environment variables.',
        fallbackMessage: 'Please manually enter your contract details in JSON format for now.'
      }, { status: 503 });
    }

    // Use Claude to extract contract data from PDF
    const prompt = `You are a financial analyst extracting contract information from a PDF document. 

Analyze the PDF and extract the following information. Return ONLY a valid JSON object with this exact structure:

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

Important requirements:
- Extract the customer/client company name
- Find the total upfront payment amount (cash_received)
- Identify the payment date when cash was/will be received
- Extract ALL contract periods with their start dates, end dates, and stated amounts
- Use YYYY-MM-DD format for all dates
- All amounts should be numbers only (no currency symbols, no commas)
- Return ONLY the JSON object, no additional text or explanation

If you cannot extract this information from the PDF, return:
{
  "error": "Could not extract contract details from PDF"
}`;

    // Claude PDF support via beta API
    // Using the Messages API with PDF beta feature
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document' as any, // TypeScript workaround for beta feature
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            } as any,
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      // @ts-ignore - Beta feature for PDF support
      betas: ['pdfs-2024-09-25'],
    });

    const extracted = response.content[0].type === 'text' ? response.content[0].text : null;
    
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

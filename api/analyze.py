from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from io import BytesIO
import base64

# Add the parent directory to path to import the analyzer
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    from asc606_analyzer_production import ASC606FinancingAnalyzer
    import pandas as pd
except ImportError as e:
    print(f"Import error: {e}", file=sys.stderr)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract parameters
            contract_data = request_data.get('contract_data')
            discount_rate = request_data.get('discount_rate', 0.06)
            license_pct = request_data.get('license_pct', 0.20)
            
            if not contract_data:
                self.send_error(400, "Missing contract_data")
                return
            
            # Create analyzer
            analyzer = ASC606FinancingAnalyzer(
                contract_data=contract_data,
                discount_rate=discount_rate,
                license_pct=license_pct
            )
            
            # Run analysis
            results = analyzer.analyze()
            
            # Generate Excel file in memory
            excel_buffer = BytesIO()
            analyzer.export_to_excel_buffer(excel_buffer)
            excel_base64 = base64.b64encode(excel_buffer.getvalue()).decode('utf-8')
            
            # Generate CSV for journal entries
            csv_buffer = BytesIO()
            analyzer.export_journal_entries_buffer(csv_buffer)
            csv_base64 = base64.b64encode(csv_buffer.getvalue()).decode('utf-8')
            
            # Prepare response
            response = {
                'success': True,
                'results': results,
                'excel_file': excel_base64,
                'csv_file': csv_base64
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {
                'success': False,
                'error': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

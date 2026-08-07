import os
import sys
import pytest
import webbrowser
import json

# Setup sys path for backend imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Backend")))

class ResultCollector:
    def __init__(self):
        self.results = []

    def pytest_runtest_logreport(self, report):
        if report.when == "call":
            status = report.outcome.upper()
            duration = round(report.duration, 3)
            # Extrapolate clean readable name
            nodeid = report.nodeid
            name = nodeid.split("::")[-1].replace("test_", "").replace("_", " ").title()
            
            error_message = ""
            if report.failed:
                error_message = str(report.longrepr)
                
            self.results.append({
                "name": name,
                "status": status,
                "duration": duration,
                "error": error_message,
                "file": nodeid.split("::")[0]
            })

def build_html_report(results):
    passed_count = sum(1 for r in results if r["status"] == "PASSED")
    failed_count = sum(1 for r in results if r["status"] == "FAILED")
    total_count = len(results)
    
    status_class = "success" if failed_count == 0 else "danger"
    status_text = "All Systems Go" if failed_count == 0 else f"{failed_count} Test(s) Failed"
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Calling Testing Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-color: #0b0f19;
            --card-bg: rgba(22, 28, 45, 0.6);
            --border-color: rgba(255, 255, 255, 0.08);
            --primary: #6366f1;
            --success: #10b981;
            --danger: #ef4444;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
        }}
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }}
        
        body {{
            background: linear-gradient(135deg, #0b0f19 0%, #111827 100%);
            color: var(--text-main);
            min-height: 100vh;
            padding: 2.5rem 1.5rem;
            display: flex;
            justify-content: center;
        }}
        
        .container {{
            max-width: 900px;
            width: 100%;
        }}
        
        header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }}
        
        h1 {{
            font-size: 1.8rem;
            font-weight: 700;
            letter-spacing: -0.025em;
            background: linear-gradient(to right, #a5b4fc, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        
        .timestamp {{
            font-size: 0.875rem;
            color: var(--text-muted);
        }}
        
        .overview-cards {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }}
        
        .card {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.5rem;
            backdrop-filter: blur(12px);
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }}
        
        .card-label {{
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
        }}
        
        .card-value {{
            font-size: 2rem;
            font-weight: 700;
        }}
        
        .card-value.success {{ color: var(--success); }}
        .card-value.danger {{ color: var(--danger); }}
        
        .test-list {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 1.5rem;
            backdrop-filter: blur(12px);
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }}
        
        .test-item {{
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.25rem;
            background: rgba(255, 255, 255, 0.02);
            transition: all 0.2s ease;
        }}
        
        .test-item:hover {{
            background: rgba(255, 255, 255, 0.04);
            transform: translateY(-1px);
        }}
        
        .test-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        
        .test-info {{
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }}
        
        .test-name {{
            font-weight: 600;
            font-size: 1.05rem;
        }}
        
        .test-meta {{
            font-size: 0.8rem;
            color: var(--text-muted);
        }}
        
        .status-badge {{
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        
        .status-badge.passed {{
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.2);
        }}
        
        .status-badge.failed {{
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }}
        
        .error-log {{
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            font-family: monospace;
            font-size: 0.8rem;
            color: #fca5a5;
            white-space: pre-wrap;
            overflow-x: auto;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div>
                <h1>Test Verification Suites</h1>
                <p class="timestamp">Scope: Authentication, JWT tokens, Rate Limiting (429), and Roles Sandbox</p>
            </div>
            <div class="btn-group">
                <span class="status-badge {status_class}">{status_text}</span>
            </div>
        </header>
        
        <div class="overview-cards">
            <div class="card">
                <span class="card-label">Total Tests</span>
                <span class="card-value">{total_count}</span>
            </div>
            <div class="card">
                <span class="card-label">Passed</span>
                <span class="card-value success">{passed_count}</span>
            </div>
            <div class="card">
                <span class="card-label">Failed</span>
                <span class="card-value danger">{failed_count}</span>
            </div>
            <div class="card">
                <span class="card-label">Environment</span>
                <span class="card-value" style="font-size: 1.25rem; font-weight:600; color:#818cf8; margin-top:0.5rem;">FastAPI + Redis</span>
            </div>
        </div>
        
        <div class="test-list">
            <h2 style="font-size: 1.2rem; margin-bottom: 0.5rem; font-weight:600;">Execution Modules</h2>
"""
    
    for r in results:
        badge_class = "passed" if r["status"] == "PASSED" else "failed"
        html_content += f"""
            <div class="test-item">
                <div class="test-header">
                    <div class="test-info">
                        <span class="test-name">{r["name"]}</span>
                        <span class="test-meta">File: {r["file"]} &middot; Duration: {r["duration"]}s</span>
                    </div>
                    <span class="status-badge {badge_class}">{r["status"]}</span>
                </div>
        """
        if r["error"]:
            html_content += f"""
                <div class="error-log">{r["error"]}</div>
            """
        html_content += "</div>"
        
    html_content += """
        </div>
    </div>
</body>
</html>
"""
    return html_content

def run_tests():
    print("==================================================")
    print("🚀 AUTOMATIC TEST SUITE RUNNER: AI CALLING PLATFORM")
    print("==================================================")
    
    collector = ResultCollector()
    
    # Run pytest programmatically
    pytest.main([
        "-v", 
        "C:\\Users\\raman\\Videos\\AI_Calling\\Testing\\test_authentication.py",
        "C:\\Users\\raman\\Videos\\AI_Calling\\Testing\\test_rate_limiting.py",
        "C:\\Users\\raman\\Videos\\AI_Calling\\Testing\\test_roles.py"
    ], plugins=[collector])
    
    # Compile results
    html_report = build_html_report(collector.results)
    
    # Save Report
    report_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "report.html"))
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(html_report)
        
    print(f"🎉 Beautiful HTML visualization report generated: {report_path}")
    print("==================================================")
    
    # Open the report in default web browser
    webbrowser.open(f"file:///{report_path}")
    
if __name__ == "__main__":
    run_tests()

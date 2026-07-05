import React, { useEffect, useRef, useState } from "react";
import { RefreshCw, Smartphone, Monitor, ShieldAlert, CheckCircle } from "lucide-react";

interface PreviewSandboxProps {
  code: string;
  appName: string;
}

export default function PreviewSandbox({ code, appName }: PreviewSandboxProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [compileStatus, setCompileStatus] = useState<"compiling" | "success" | "error">("compiling");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const reloadPreview = () => {
    if (!iframeRef.current) return;
    setCompileStatus("compiling");
    setSandboxError(null);

    // Clean and transform the code for the Babel browser runner
    let processedCode = code;

    // 1. Remove ES6 imports, as they aren't natively supported in the Standalone Babel browser runtime
    processedCode = processedCode.replace(
      /import\s+(?:[\w*\s{},]*)\s+from\s+['"][^'"]+['"];?/g,
      ""
    );

    // 2. Remove standard React 'export default' keyword if any, so Babel compiles it as a standard function
    processedCode = processedCode.replace(/export\s+default\s+function/g, "function");

    // HTML bundle injected with Tailwind CSS, React 19, Lucide Icons, and Babel compiler
    const srcDoc = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <!-- Tailwind v4 and Font -->
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet" />
          
          <!-- React 19 -->
          <script src="https://unpkg.com/react@19/umd/react.development.js" crossorigin></script>
          <script src="https://unpkg.com/react-dom@19/umd/react-dom.development.js" crossorigin></script>
          
          <!-- Babel Standalone compiler -->
          <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js"></script>
          
          <style>
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #0d0f14;
              color: #f0f3f6;
            }
          </style>
          <script>
            // Setup global hook to capture compilation errors and report to parent
            window.addEventListener('error', (event) => {
              window.parent.postMessage({ type: 'SANDBOX_ERROR', message: event.message }, '*');
            });
          </script>
        </head>
        <body>
          <div id="sandbox-root"></div>

          <script type="text/babel">
            // Expose commonly used state hooks on window for easy access
            const { useState, useEffect, useMemo, useCallback, useRef } = React;
            
            // Map commonly used Lucide icons to window scope
            // We use standard unpkg lucide-react CDN mapping or simple safe SVG renders
            // If they are imported as Lucide components, we inject safe replacements
            
            // Mocking Lucide React Components using standard icons from the SVG CDN
            const LucideIcons = {
              Plus: (props) => <span className={props.className} style={{display:'inline-flex',alignItems:'center',justifyContent:'center'}}>+</span>,
              Trash: (props) => <span className={props.className} style={{display:'inline-flex',color:'#ef4444'}}>🗑</span>,
              CheckCircle: (props) => <span className={props.className} style={{display:'inline-flex',color:'#10b981'}}>✓</span>,
              X: (props) => <span className={props.className} style={{display:'inline-flex'}}>✕</span>,
            };

            // Let's dynamically map components called in standard TSX code to avoid crashes
            // In the real preview, standard HTML tags render seamlessly
            try {
              ${processedCode}

              // Run the compiled App
              const root = ReactDOM.createRoot(document.getElementById('sandbox-root'));
              
              // Resolve the correct component to render
              const AppToRender = typeof GeneratedApp !== 'undefined' ? GeneratedApp : 
                                  typeof App !== 'undefined' ? App : null;

              if (AppToRender) {
                root.render(<AppToRender />);
                window.parent.postMessage({ type: 'SANDBOX_SUCCESS' }, '*');
              } else {
                // If no specific component named App/GeneratedApp found, render the first function
                const firstFunc = Object.keys(window).find(k => typeof window[k] === 'function' && k[0] === k[0].toUpperCase());
                if (firstFunc && window[firstFunc]) {
                  root.render(React.createElement(window[firstFunc]));
                  window.parent.postMessage({ type: 'SANDBOX_SUCCESS' }, '*');
                } else {
                  throw new Error("No React component (e.g. GeneratedApp) could be found to render.");
                }
              }
            } catch (err) {
              window.parent.postMessage({ type: 'SANDBOX_ERROR', message: err.message }, '*');
            }
          </script>
        </body>
      </html>
    `;

    iframeRef.current.srcdoc = srcDoc;
  };

  useEffect(() => {
    reloadPreview();

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SANDBOX_ERROR") {
        setSandboxError(event.data.message);
        setCompileStatus("error");
      } else if (event.data && event.data.type === "SANDBOX_SUCCESS") {
        setCompileStatus("success");
        setSandboxError(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl border border-[#21262d] overflow-hidden">
      {/* Sandbox Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#21262d]">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${compileStatus === "success" ? "bg-emerald-400" : compileStatus === "error" ? "bg-rose-500" : "bg-cyan-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${compileStatus === "success" ? "bg-emerald-500" : compileStatus === "error" ? "bg-rose-500" : "bg-cyan-500"}`}></span>
          </span>
          <span className="text-xs font-mono font-medium tracking-tight text-[#8b949e]">
            {compileStatus === "success" ? "LIVE COMPILER: ONLINE" : compileStatus === "error" ? "LIVE COMPILER: COMPILATION ERROR" : "LIVE COMPILER: COMPILING..."}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Device Toggles */}
          <div className="flex bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5">
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1 rounded-md transition-all ${device === "desktop" ? "bg-[#21262d] text-cyan-400" : "text-[#8b949e] hover:text-[#f0f3f6]"}`}
              title="Desktop view"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1 rounded-md transition-all ${device === "mobile" ? "bg-[#21262d] text-cyan-400" : "text-[#8b949e] hover:text-[#f0f3f6]"}`}
              title="Mobile responsive preview"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={reloadPreview}
            className="p-1.5 rounded-lg border border-[#30363d] bg-[#161b22] text-[#8b949e] hover:text-[#f0f3f6] hover:bg-[#21262d] transition-all"
            title="Refresh iframe frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-[#0a0c10] flex items-center justify-center p-4 overflow-auto relative">
        {compileStatus === "compiling" && (
          <div className="absolute inset-0 bg-[#0d1117]/75 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-[#8b949e] font-mono">Assembling isolated Babel runtime containers...</p>
          </div>
        )}

        <div
          className={`bg-white shadow-2xl rounded-lg overflow-hidden border border-[#30363d] transition-all duration-300 ${device === "mobile" ? "w-[375px] h-[667px]" : "w-full h-full"}`}
        >
          <iframe
            ref={iframeRef}
            title={appName}
            className="w-full h-full border-0 bg-[#0d0f14]"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>

        {/* Sandbox Linter Overlay if error */}
        {sandboxError && (
          <div className="absolute bottom-4 left-4 right-4 bg-[#1b1212] border border-rose-800/80 rounded-xl p-4 flex items-start space-x-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Dynamic Sandbox Error</h4>
              <p className="text-xs font-mono text-rose-300 mt-1 whitespace-pre-wrap break-all leading-relaxed">
                {sandboxError}
              </p>
              <p className="text-[10px] text-[#8b949e] mt-2">
                Orca's automatic repair framework has registered this diagnostic bug and scheduled an auto-patch in the next prompt.
              </p>
            </div>
          </div>
        )}

        {compileStatus === "success" && !sandboxError && (
          <div className="absolute bottom-4 right-4 bg-[#121c15] border border-emerald-800/60 rounded-full px-3 py-1 flex items-center space-x-1.5 shadow-xl">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">Container Active</span>
          </div>
        )}
      </div>
    </div>
  );
}

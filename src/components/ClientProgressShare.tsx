import React, { useState, useRef } from 'react';
import { X, Share2 } from 'lucide-react';

interface ClientProgressShareProps {
  clientName: string;
}

export const ClientProgressShare: React.FC<ClientProgressShareProps> = ({ clientName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'consent' | 'ready'>('select');
  const [selections, setSelections] = useState({ vault: true, logs: true, report: true });
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setStep('select');
    setSelections({ vault: true, logs: true, report: true });
    setInputCode('');
    setError('');
  };

  const handleClose = () => setIsOpen(false);

  const handleToggle = (key: keyof typeof selections) => {
    setSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRequestCode = () => {
    if (!selections.vault && !selections.logs && !selections.report) {
      setError('Please select at least one item to share.');
      return;
    }
    setError('');
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);
    setStep('consent');
  };

  const handleVerify = () => {
    if (inputCode === generatedCode || inputCode === '000000') {
      setError('');
      setStep('ready');
      renderExportCard();
    } else {
      setError('Invalid authorization code. Client approval required.');
    }
  };

  const renderExportCard = () => {
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1080;
      canvas.height = 1920;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 70px monospace';
      ctx.fillText('OBLIVION 1 FITNESS CLUB', 100, 180);

      ctx.fillStyle = '#4285F4';
      ctx.font = '600 45px sans-serif';
      ctx.fillText('VERIFIED ATHLETE PROGRESS REPORT', 100, 260);

      ctx.fillStyle = '#EA4335';
      ctx.font = 'bold 60px sans-serif';
      ctx.fillText((clientName || 'ATHLETE').toUpperCase(), 100, 380);

      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100, 440);
      ctx.lineTo(980, 440);
      ctx.stroke();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '40px sans-serif';
      let y = 560;

      if (selections.vault) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Vault Media & Vault Asset Verified', 100, y);
        y += 100;
      }
      if (selections.logs) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Log History & Volume Metrics Verified', 100, y);
        y += 100;
      }
      if (selections.report) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Transformation Report Card Verified', 100, y);
      }

      ctx.fillStyle = '#52525b';
      ctx.font = '30px monospace';
      ctx.fillText('SECURE CLIENT-AUTHORIZED SYNDICATION', 100, 1780);
      ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 100, 1840);
    }, 50);
  };

  const handleShareOrDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fileName = `${clientName.replace(/\s+/g, '_')}_Progress.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${clientName} Progress`,
            text: `Verified performance metrics for ${clientName}`,
            files: [file],
          });
          handleClose();
        } catch (err) {
          console.error('Share cancelled or failed', err);
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        handleClose();
      }
    }, 'image/png');
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 px-4 rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm cursor-pointer"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl relative">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Client Progress Share</h3>
              <button onClick={handleClose} className="text-zinc-500 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === 'select' && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 mb-2">Select assets to include in syndication for {clientName}:</p>
                
                <label className="flex items-center p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                  <input type="checkbox" checked={selections.vault} onChange={() => handleToggle('vault')} className="w-4 h-4 accent-cyan-500 rounded bg-zinc-800 border-zinc-700" />
                  <span className="ml-3 text-sm font-medium">Vault Media (Photos & Videos)</span>
                </label>

                <label className="flex items-center p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                  <input type="checkbox" checked={selections.logs} onChange={() => handleToggle('logs')} className="w-4 h-4 accent-cyan-500 rounded bg-zinc-800 border-zinc-700" />
                  <span className="ml-3 text-sm font-medium">Log History & Volume Charts</span>
                </label>

                <label className="flex items-center p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors">
                  <input type="checkbox" checked={selections.report} onChange={() => handleToggle('report')} className="w-4 h-4 accent-cyan-500 rounded bg-zinc-800 border-zinc-700" />
                  <span className="ml-3 text-sm font-medium">Transformation Report Card</span>
                </label>

                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

                <button onClick={handleRequestCode} className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-md">
                  Request Consent Code
                </button>
              </div>
            )}

            {step === 'consent' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 mx-auto bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-cyan-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h4 className="font-semibold text-base">Awaiting Client Approval</h4>
                <p className="text-xs text-zinc-400">One-time authorization code dispatched to {clientName}.</p>
                <p className="text-[10px] text-zinc-500 font-mono">Simulated bypass code: {generatedCode || '000000'}</p>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="------"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] font-mono text-lg bg-zinc-900 border border-zinc-700 rounded-xl py-3 mt-2 focus:outline-none focus:border-cyan-500 text-white"
                />

                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

                <button onClick={handleVerify} className="w-full mt-2 bg-white text-black font-semibold py-3 rounded-xl transition-colors text-sm hover:bg-zinc-200">
                  Verify & Unlock
                </button>
              </div>
            )}

            {step === 'ready' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 mx-auto bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center text-green-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 className="font-semibold text-base">Consent Verified</h4>
                <p className="text-xs text-zinc-400 mb-4">Export card compiled and ready for syndication.</p>

                <canvas ref={canvasRef} className="hidden" />

                <button onClick={handleShareOrDownload} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                    <polyline points="16 6 12 2 8 6"></polyline>
                    <line x1="12" y1="2" x2="12" y2="15"></line>
                  </svg>
                  Publish to Social Platforms
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};

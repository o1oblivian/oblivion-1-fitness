import JSZip from 'jszip';

export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Load source files dynamically on-demand when user requests ZIP
  const sourceModules = import.meta.glob([
    '/src/**/*.{ts,tsx,css,json}',
    '/public/**/*.{json,txt,xml,redirects}',
    '/index.html',
    '/package.json',
    '/vite.config.ts',
    '/tsconfig.json',
    '/.gitignore'
  ], { query: '?raw', import: 'default' });

  for (const filePath in sourceModules) {
    try {
      const getContent = sourceModules[filePath] as () => Promise<string>;
      const content = await getContent();
      if (typeof content === 'string') {
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        zip.file(cleanPath, content);
      }
    } catch (err) {
      console.warn('Could not include file in zip:', filePath, err);
    }
  }

  // Ensure README.md is present
  if (!zip.file('README.md')) {
    zip.file('README.md', `# Oblivion 1 Fitness Club (O1FC Official)\n\nHigh-Performance Training OS Pro, Fuel OS, Coach Hub, and Telemetry Intelligence.\n\n## Getting Started\n\n1. Run \`npm install\`\n2. Run \`npm run dev\`\n3. Open http://localhost:3000 in your browser.\n`);
  }

  // Generate ZIP blob and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'O1FC_Official_Source_Code.zip';
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

import React, { useRef } from 'react';
import Modal from './Modal';
import QRCode from 'qrcode';
import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const QRModal = ({ isOpen, onClose, qrCode }) => {
  const qrRef = useRef(null);

  if (!qrCode) return null;

  const clientUrl = window.location.origin;
  const targetUrl = `${clientUrl}/q/${qrCode.token}`;

  const downloadPNG = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(targetUrl, { width: 600, margin: 2 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `QR_${qrCode.token}_${qrCode.tableName || 'menu'}.png`;
      link.click();
      toast.success('PNG QR code downloaded!');
    } catch (err) {
      toast.error('Failed to download QR code.');
    }
  };

  const downloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(targetUrl, { type: 'svg', width: 600, margin: 2 });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_${qrCode.token}_${qrCode.tableName || 'menu'}.svg`;
      link.click();
      toast.success('SVG QR code downloaded!');
    } catch (err) {
      toast.error('Failed to download SVG.');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const qrCanvas = qrRef.current.querySelector('canvas');
    const dataUrl = qrCanvas ? qrCanvas.toDataURL() : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${qrCode.tableName || 'Menu Table'}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { border: 2px solid #000; padding: 40px; border-radius: 20px; width: 320px; }
            h2 { margin-bottom: 5px; font-size: 24px; }
            p { font-size: 16px; color: #555; margin-top: 0; }
            img { width: 250px; height: 250px; }
            .tag { margin-top: 15px; font-weight: bold; background: #eee; padding: 6px 12px; border-radius: 8px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Scan for Digital Menu</h2>
            <p>${qrCode.branch?.name || 'Restaurant Branch'}</p>
            <img src="${dataUrl}" />
            <div class="tag">${qrCode.tableName || 'Scan & Order'}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code Details & Export">
      <div className="flex flex-col items-center space-y-6">
        {/* QR Code Canvas */}
        <div ref={qrRef} className="p-6 bg-white rounded-2xl shadow-inner border border-slate-200">
          <QRCodeCanvas url={targetUrl} />
        </div>

        {/* QR Meta */}
        <div className="text-center space-y-1">
          <h4 className="font-bold text-lg text-slate-900 dark:text-white">
            {qrCode.tableName || 'General QR Code'}
          </h4>
          <p className="text-sm text-slate-500">
            Menu: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{qrCode.menu?.name}</span>
          </p>
          <p className="text-xs text-slate-400 break-all bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            {targetUrl}
          </p>
        </div>

        {/* Export Action Buttons */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <button
            onClick={downloadPNG}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-emerald-500" />
            PNG
          </button>
          <button
            onClick={downloadSVG}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-indigo-500" />
            SVG
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
          >
            <PrinterIcon className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Internal canvas renderer
const QRCodeCanvas = ({ url }) => {
  const canvasRef = useRef(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 1 });
    }
  }, [url]);

  return <canvas ref={canvasRef} />;
};

export default QRModal;

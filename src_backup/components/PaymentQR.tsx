
'use client';

import React from 'react';
import QRCode from 'qrcode.react';

interface Props {
  vpa?: string;
  name?: string;
  amount?: number;
  size?: number;
}

/**
 * Generates a UPI Payment QR code.
 * Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR
 */
export default function PaymentQR({ vpa = "lone07936@okaxis", name = "Firdous Ahmad & Co", amount, size = 100 }: Props) {
  const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&cu=INR${amount ? `&am=${amount}` : ''}`;

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-white rounded-2xl shadow-lg border border-gray-100">
       <QRCode
        value={upiUrl}
        size={size}
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        includeMargin={false}
        renderAs="canvas"
        aria-label="UPI Payment QR Code"
      />
      <div className="flex flex-col items-center">
        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">Scan to Pay via UPI</p>
        <p className="text-[8px] text-gray-500 font-mono tracking-widest">{vpa}</p>
      </div>
    </div>
  );
}

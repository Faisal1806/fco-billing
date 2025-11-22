
'use client';

import React from 'react';
import QRCode from 'qrcode.react';

const upiId = "firdousahmad.70061@oksbi";
const companyName = "Firdous Ahmad & Company";
const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}`;

interface Props {
  size?: number;
}

export default function BusinessCardQR({ size = 80 }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
       <QRCode
        value={upiUrl}
        size={size}
        bgColor="transparent"
        fgColor="#000000"
        level="L"
        includeMargin={false}
      />
      <p className="text-[8px] text-center font-semibold">Scan to Pay via UPI</p>
    </div>
  );
}

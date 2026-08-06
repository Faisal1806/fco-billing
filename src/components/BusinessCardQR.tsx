'use client';

import React from 'react';
import QRCode from 'qrcode.react';

// vCard (Virtual Contact Card) data
const vCard = `BEGIN:VCARD
VERSION:3.0
FN:Firdous Ahmad & Company
N:Ahmad;Faisal;;;
TITLE:Manager
TEL;TYPE=CELL:7006136330
TEL;TYPE=CELL:9797002164
TEL;TYPE=CELL:9906740921
EMAIL:lone07936@gmail.com
ORG:Firdous Ahmad & Company
ADR;TYPE=WORK:;;Shed No. 13, Fud No. 12-A Fruit Mandi;Sopore;Kashmir;193201;India
END:VCARD`;


interface Props {
  size?: number;
}

export default function BusinessCardQR({ size = 80 }: Props) {
  const qrSize = Math.max(56, Math.min(size, 70));

  return (
    <div className="flex flex-col items-center gap-1 qr-print-safe">
      <QRCode
        value={vCard}
        size={qrSize}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="H"
        includeMargin={false}
        renderAs="svg"
        aria-label="QR code"
      />
      <p className="text-[8px] text-center font-semibold">Scan to Save Contact</p>
      <style jsx global>{`
        .qr-print-safe svg {
          display: block;
          width: ${qrSize}px;
          height: ${qrSize}px;
          shape-rendering: geometricPrecision;
          image-rendering: crisp-edges;
          image-rendering: -webkit-optimize-contrast;
        }
        @media print {
          .qr-print-safe {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .qr-print-safe svg {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}



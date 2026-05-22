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
  return (
    <div className="flex flex-col items-center gap-1">
       <QRCode
        value={vCard}
        size={size}
        bgColor="transparent"
        fgColor="#000000"
        level="M"
        includeMargin={false}
        renderAs="canvas"
        aria-label="QR code"
      />
      <p className="text-[8px] text-center font-semibold">Scan to Save Contact</p>
    </div>
  );
}

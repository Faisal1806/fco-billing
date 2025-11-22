
'use client';

import React from 'react';
import QRCode from 'qrcode.react';

const upiId = "firdousahmad.70061@oksbi"; // IMPORTANT: Replace with your actual UPI ID
const companyName = "Firdous Ahmad & Company";
const contactPerson = "Firdous Ahmad";
const phone = "7006136330";
const address = "Shed No. 13, Fud No. 12-A, Fruit Mandi, Sopore, Kashmir";
const mapsUrl = "https://maps.google.com/?q=Fruit+Mandi+Sopore";
const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}`;

// vCard data for contact details
const vCard = `BEGIN:VCARD
VERSION:3.0
N:${contactPerson};;;
FN:${companyName}
ORG:${companyName}
TEL;TYPE=WORK,VOICE:${phone}
ADR;TYPE=WORK:;;${address}
URL:${mapsUrl}
NOTE:Pay via UPI: ${upiUrl}
END:VCARD`;

interface Props {
  size?: number;
}

export default function BusinessCardQR({ size = 80 }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
       <QRCode
        value={vCard}
        size={size}
        bgColor="transparent"
        fgColor="#000000"
        level="L"
        includeMargin={false}
      />
      <p className="text-xs text-center font-semibold">Scan for Details & UPI</p>
    </div>
  );
}


import QRCode from 'qrcode.react';
import { Separator } from '@/components/ui/separator';
import BusinessCardQR from '../BusinessCardQR';

export const ThermalLayout = ({ billData, pageUrl }: { billData: any, pageUrl: string }) => {
    const { 
        sNo = '', 
        date = '', 
        date2 = '', 
        customerName = '', 
        watakNo = '', 
        entries = [], 
        totals = { 
            grossSale: 0, 
            labour: 0, 
            commissionAmount: 0,
            association: 0, 
            security: 0, 
            totalExpenses: 0, 
            netSale: 0 
        }, 
        freight = 0 
    } = billData || {};
    
    return (
        <div className="w-[80mm] bg-white text-black p-2 font-sans text-xs leading-tight">
            <header className="text-center space-y-1">
                <h1 className="text-sm font-bold">Firdous Ahmad & Company</h1>
                <p className="text-[10px]">Fruit Merchants & Commission Agents, Sopore, Kashmir</p>
                <p className="text-[10px]">Ph: 7006136330</p>
                <p className="border-t border-dashed border-black mt-1 pt-1 font-bold">Sale Invoice</p>
            </header>
            <main className="my-2 border-t border-b border-dashed border-black py-2 space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Bill No: {sNo}</span> <span>Date: {date ? new Date(date).toLocaleDateString('en-GB') : 'N/A'}</span></div>
                {date2 && <div className="flex justify-end"><span>Date 2: {new Date(date2).toLocaleDateString('en-GB')}</span></div>}
                {watakNo && <div className="flex justify-between"><span>Watak: {watakNo}</span></div>}
                <div>Customer: {customerName}</div>
            </main>
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left">Item</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry: any, i: number) => (
                        <tr key={i} className="border-b border-dashed border-black">
                            <td className="text-left py-1">{entry.variety} ({entry.type})</td>
                            <td className="text-right">{entry.qty}</td>
                            <td className="text-right">{entry.isForwarded ? 'Fwd' : (entry.rate || 0).toFixed(2)}</td>
                            <td className="text-right">{entry.isForwarded ? 'Fwd' : (entry.total || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="my-2 border-t border-dashed border-black pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Gross Sale:</span><span>{(totals?.grossSale || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Freight:</span><span>- {(freight || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Labour:</span><span>- {(totals?.labour || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Commission:</span><span>- {(totals?.commissionAmount || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Other Exp:</span><span>- {((totals?.association || 0) + (totals?.security || 0)).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total Exp:</span><span>- {(totals?.totalExpenses || 0).toFixed(2)}</span></div>
            </div>
             <div className="my-2 border-t-2 border-black pt-1 space-y-1 text-sm font-bold">
                <div className="flex justify-between"><span>NET SALE:</span><span>₹{(totals?.netSale || 0).toFixed(2)}</span></div>
            </div>
            <footer className="text-center pt-2 border-t border-dashed border-black text-[10px]">
                <p>Thank you for your business!</p>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                    <BusinessCardQR size={60} />
                    <div className="flex flex-col items-center justify-center">
                        <QRCode value={pageUrl} size={60} />
                        <p className="text-[8px] font-semibold mt-1">Scan to View Bill</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};


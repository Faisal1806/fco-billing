import { Logo } from "@/components/logo";
import BusinessCardQR from "@/components/BusinessCardQR";
import PaymentQR from "@/components/PaymentQR";
import QRCode from 'qrcode.react';

export const ClassicA4Layout = ({ billData, pageUrl }: { billData: any, pageUrl:string }) => {
    // Defensive destructuring with robust defaults to prevent formatting errors
    const { 
        sNo = '', 
        date = '', 
        date2 = '', 
        customerName = 'N/A', 
        watakNo = '', 
        khata = '', 
        entries = [], 
        totals = { 
            subtotal: 0, 
            grossSale: 0, 
            labour: 0, 
            association: 0, 
            security: 0, 
            commissionAmount: 0,
            totalExpenses: 0, 
            netSale: 0,
            totalQty: 0,
            pattiQty: 0,
            dabbaQty: 0
        }, 
        freight = 0 
    } = billData || {};

    const emptyRowsCount = Math.max(0, 12 - entries.length);
    const emptyRows = Array.from({ length: emptyRowsCount });

   return (
        <div className="w-[146mm] h-[208mm] overflow-hidden bg-[#FDFEE2] text-black shadow-lg print:shadow-none p-2 border border-green-700 flex flex-col relative font-serif mx-auto">
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <Logo className="w-40 h-40 opacity-10" />
            </div>
            <div className="relative z-10 flex flex-col flex-grow">
                <header className="text-center border-b border-green-700 pb-0.5">
                    <div className="flex justify-between items-start">
                         <div className="text-left text-xs font-bold flex items-center gap-1">
                            <p>🍎</p>
                            <p>F.Co App</p>
                         </div>
                         <div className="flex-grow">
                            <div className="text-[8px] leading-tight">
                                 <p className="font-bold">Prop: Firdous Ahmad Lone (Nadihal)</p>
                                 <p>Cell: 7006136330, 9797002164, 9906740921</p>
                            </div>
                            <h1 className="text-xl font-bold text-green-800" style={{fontFamily: "'Times New Roman', Times, serif"}}>FIRDOUS AHMAD & COMPANY</h1>
                            <p className="text-[10px] font-semibold">Fruit Merchants & Commission Agents</p>
                            <p className="text-[8px]">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                         </div>
                         <div className="text-right text-xs font-bold flex items-center gap-1">
                             <p>F.Co App</p>
                            <p>🍎</p>
                         </div>
                    </div>
                </header>
                <section className="flex justify-between items-start my-1 text-sm">
                    <div className="flex-1">
                        <p><strong>M/s:</strong> {customerName}</p>
                        {khata && <p><strong>Khata:</strong> {khata}</p>}
                    </div>
                    <div className="text-right text-xs">
                        <p><strong>Bill No:</strong> {sNo}</p>
                        <p><strong>Date:</strong> {date ? new Date(date).toLocaleDateString('en-GB') : 'N/A'}</p>
                        {date2 && <p><strong>Date 2:</strong> {new Date(date2).toLocaleDateString('en-GB')}</p>}
                        {watakNo && <p><strong>Watak No:</strong> {watakNo}</p>}
                    </div>
                </section>
                <main className="flex-grow">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-y-2 border-green-700">
                                <th className="p-1 text-left border-r border-green-600/50">TYPE</th>
                                <th className="p-1 text-left border-r border-green-600/50">VARIETY</th>
                                <th className="p-1 text-center border-r border-green-600/50">QTY</th>
                                <th className="p-1 text-right border-r border-green-600/50">RATE</th>
                                <th className="p-1 text-right">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry: any, index: number) => (
                                <tr key={index} className="h-4">
                                    <td className="py-0.5 px-1 border-r border-green-600/50">{entry.type}</td>
                                    <td className="py-0.5 px-1 border-r border-green-600/50">{entry.variety}</td>
                                    <td className="py-0.5 px-1 text-center border-r border-green-600/50">{entry.qty}</td>
                                    <td className="py-0.5 px-1 text-right border-r border-green-600/50">{entry.isForwarded ? 'Forwarded' : `₹${(Number(entry.rate) || 0).toFixed(2)}`}</td>
                                    <td className="py-0.5 px-1 text-right font-semibold">{entry.isForwarded ? 'Forwarded' : `₹${(Number(entry.total) || 0).toFixed(2)}`}</td>
                                </tr>
                            ))}
                            {emptyRows.map((_, index) => (
                                <tr key={`empty-${index}`} className="h-4">
                                    <td className="py-0.5 px-1 border-r border-green-600/50">&nbsp;</td>
                                    <td className="py-0.5 px-1 border-r border-green-600/50"></td>
                                    <td className="py-0.5 px-1 border-r border-green-600/50"></td>
                                    <td className="py-0.5 px-1 border-r border-green-600/50"></td>
                                    <td className="py-0.5 px-1"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>
                <footer className="mt-auto pt-0 text-[10px] leading-tight">
                    <div className="grid grid-cols-2 gap-x-4">
                        <div className="space-y-0.5 pr-4 flex flex-col justify-between">
                            <div>
                                <p><strong>Total Quantity:</strong> {totals?.totalQty || 0} (Patti: {totals?.pattiQty || 0}, Dabba: {totals?.dabbaQty || 0})</p>
                                <div className="mt-2 flex gap-4 items-end">
                                    <BusinessCardQR size={40} />
                                   
                                    
                                </div>
                            </div>
                            <div className="mt-2">
                                <PaymentQR size={48} amount={totals?.netSale || 0} />
                            </div>
                        </div>
                        <div className="space-y-0.5 border-l-2 border-green-700 pl-4 text-[10px]">
                            <div className="flex justify-between"><span>Subtotal:</span> <span className="font-semibold">₹{(Number(totals?.subtotal) || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold border-t border-gray-400"><span>Gross Sale:</span> <span>₹{(Number(totals?.grossSale) || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Freight:</span> <span>- ₹{(Number(freight) || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Labour:</span> <span>- ₹{(Number(totals?.labour) || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Association:</span> <span>- ₹{(Number(totals?.association) || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Security:</span> <span>- ₹{(Number(totals?.security) || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold border-t border-gray-400"><span>Total Exp:</span> <span>- ₹{(Number(totals?.totalExpenses) || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-base border-t border-gray-400"><span>Net Sale:</span> <span>₹{(Number(totals?.netSale) || 0).toFixed(2)}</span></div>
                        </div>
                    </div>
                    <div className="flex justify-end items-end mt-1">
                        <div className="text-center">
                            <p className="font-signature text-2xl text-gray-700">Faisal</p>
                            <p className="font-bold -mt-2 text-[10px]">Sign. Of Manager</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
};
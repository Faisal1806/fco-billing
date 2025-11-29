import { Logo } from "@/components/logo";
import BusinessCardQR from "@/components/BusinessCardQR";
import { Separator } from "@/components/ui/separator";
import QRCode from 'qrcode.react';

export const ModernLightA4Layout = ({ billData, pageUrl }: { billData: any, pageUrl: string }) => {
    const { sNo, date, date2, customerName, watakNo, khata, entries, totals, freight } = billData;
    
    return (
        <div className="w-[148mm] min-h-[210mm] mx-auto bg-white text-gray-800 shadow-2xl print:shadow-none p-6 flex flex-col font-sans relative">
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <Logo className="w-96 h-96 opacity-[0.03]" />
            </div>
             <div className="relative z-10 flex flex-col flex-grow">
                <header className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <div className="text-left text-sm font-bold flex items-center gap-2">
                           <Logo className="h-8 w-8"/> F.Co
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold tracking-wider">FIRDOUS AHMAD & COMPANY</h2>
                            <p className="mt-1 text-[10px] opacity-90">Fruit Merchants & Commission Agents</p>
                            <p className="text-[8px] opacity-90">SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.</p>
                        </div>
                        <div className="text-right text-sm font-bold flex items-center gap-2">
                           F.Co <Logo className="h-8 w-8"/>
                        </div>
                    </div>
                </header>

                <main className="bg-white/50 p-4 rounded-b-xl flex-grow mt-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-3 mb-3 text-sm">
                        <div>
                            <h2 className="font-semibold text-gray-500">Bill To: / <span className="font-urdu">بل بنام</span></h2>
                            <p className="font-bold text-base text-gray-900">{customerName}</p>
                            {khata && <p className="text-gray-500">Khata: {khata}</p>}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                             <p><strong>Bill No:</strong> <span className="text-gray-900 font-mono">{sNo}</span></p>
                             <p><strong>Date:</strong> <span className="text-gray-900 font-mono">{new Date(date).toLocaleDateString('en-GB')}</span></p>
                             {date2 && <p><strong>Date 2:</strong> <span className="text-gray-900 font-mono">{new Date(date2).toLocaleDateString('en-GB')}</span></p>}
                             <p><strong>Watak No:</strong> <span className="text-gray-900 font-mono">{watakNo}</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-6 text-xs">
                        <div className="col-span-3">
                            <table className="w-full">
                                <thead className="text-gray-500 uppercase">
                                    <tr className="border-b border-gray-200">
                                        <th className="pb-2 text-left font-semibold">Type</th>
                                        <th className="pb-2 text-left font-semibold">Variety</th>
                                        <th className="pb-2 text-center font-semibold">Qty</th>
                                        <th className="pb-2 text-right font-semibold">Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((entry: any, index: number) => (
                                        <tr key={index} className="border-b border-gray-200/50">
                                            <td className="py-2">{entry.type}</td>
                                            <td className="py-2">{entry.variety}</td>
                                            <td className="py-2 text-center font-mono">{entry.qty}</td>
                                            <td className="py-2 text-right font-mono">{entry.isForwarded ? 'Forward' : `₹${entry.rate.toFixed(2)}`}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="col-span-2 border-l border-gray-200 pl-6">
                            <h3 className="text-gray-500 uppercase font-semibold pb-2 border-b border-gray-200">Expenses</h3>
                             <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-center"><span className="text-gray-500">Freight</span><span className="font-mono text-gray-800">₹{freight.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-500">Labour</span><span className="font-mono text-gray-800">₹{totals.labour.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-500">Association</span><span className="font-mono text-gray-800">₹{totals.association.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-500">Security</span><span className="font-mono text-gray-800">₹{totals.security.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center font-semibold pt-1 border-t border-gray-200/50"><span className="text-gray-600">Commission</span><span className="font-mono text-gray-800">₹{totals.commissionAmount.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-5 gap-6">
                        <div className="col-span-3 text-xs">
                             <p className="text-gray-500"><strong>Total Quantity:</strong> <span className="font-mono text-gray-800">{totals.totalQty} (Patti: {totals.pattiQty}, Dabba: {totals.dabbaQty})</span></p>
                        </div>
                         <div className="col-span-2 space-y-1 text-sm border-l border-gray-200 pl-6">
                            <div className="flex justify-between items-center text-gray-500">
                                <span>Gross Sale:</span>
                                <span className="font-mono text-gray-800">₹{totals.grossSale.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between items-center text-gray-500">
                                <span>Total Expenses:</span>
                                <span className="font-mono text-gray-800">- ₹{totals.totalExpenses.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2 bg-gray-300" />
                             <div className="flex justify-between items-center text-lg font-bold text-green-600 pt-1">
                                <span >Net Sale:</span>
                                <span className="font-mono">₹{totals.netSale.toFixed(2)}</span>
                             </div>
                        </div>
                    </div>
                </main>

                <footer className="flex justify-between items-end mt-auto pt-4 border-t border-gray-200 text-xs">
                     <div className="grid grid-cols-1">
                        <BusinessCardQR size={64} />
                    </div>
                    <div className="text-right text-gray-500">
                        <p className="font-signature text-3xl text-gray-800">Faisal</p>
                        <p className="font-bold -mt-2">Sign. of Manager</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

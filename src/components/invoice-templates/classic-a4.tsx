import { Logo } from "@/components/logo";
import BusinessCardQR from "@/components/BusinessCardQR";

export const ClassicA4Layout = ({
  billData,
  pageUrl,
}: {
  billData: any;
  pageUrl: string;
}) => {
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
      securityCharges: 0,
      postage: 0,
      serviceCharges: 0,
      totalExpenses: 0,
      netSale: 0,
      totalQty: 0,
      pattiQty: 0,
      dabbaQty: 0,
    },
    freight = 0,
  } = billData || {};

  const emptyRowsCount = Math.max(0, 10 - entries.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const money = (value: unknown) => {
    const number = Number(value) || 0;
    return `₹${number.toFixed(2)}`;
  };

  const formatDate = (value: string) => {
    if (!value) return 'N/A';

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('en-GB');
  };

  return (
    <div className="invoice-paper relative mx-auto flex h-[208mm] w-[146mm] flex-col overflow-hidden border border-green-700 bg-white p-2 font-serif text-black shadow-lg print:shadow-none">
      


      <div className="relative z-10 flex flex-grow flex-col">

        {/* HEADER */}
        <header className="border-b border-green-700 pb-0.5">
          <div className="flex items-start justify-between">

            <div className="flex items-center gap-1 text-left text-xs font-bold">
              <p>F.Co</p>
            </div>

            <div className="flex-grow text-center">
              <div className="text-[8px] leading-tight">
                <p className="font-bold">
                  Prop: Firdous Ahmad Lone (Nadihal)
                </p>

                <p>
                  Cell: 7006136330, 9797002164, 9906740921
                </p>
              </div>

              <h1
                className="text-xl font-bold text-green-800"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                FIRDOUS AHMAD & COMPANY
              </h1>

              <p className="text-[10px] font-semibold">
                Fruit Merchants & Commission Agents
              </p>

              <p className="text-[8px]">
                SHED NO. 13, FUD NO. 12-A FRUIT MANDI APPLE TOWN, SOPORE - KMR.
              </p>
            </div>

            <div className="flex items-center gap-1 text-right text-xs font-bold">
              <p>F.Co</p>
            </div>

          </div>
        </header>

        {/* CUSTOMER / BILL INFO */}
        <section className="my-1 flex items-start justify-between text-sm">

          <div className="flex-1">
            <p>
              <strong>M/s:</strong> {customerName}
            </p>

            {khata && (
              <p>
                <strong>Khata:</strong> {khata}
              </p>
            )}
          </div>

          <div className="text-right text-xs">
            <p>
              <strong>Invoice No:</strong> {sNo}
            </p>

            <p>
              <strong>Date:</strong> {formatDate(date)}
            </p>

            {date2 && (
              <p>
                <strong>Date 2:</strong> {formatDate(date2)}
              </p>
            )}

            {watakNo && (
              <p>
                <strong>Watak No:</strong> {watakNo}
              </p>
            )}
          </div>

        </section>

        {/* ITEMS */}
        <main className="flex-grow">

          <table className="w-full border-collapse text-xs">

            <thead>
              <tr className="border-y-2 border-green-700">

                <th className="border-r border-green-600/50 p-1 text-left">
                  TYPE
                </th>

                <th className="border-r border-green-600/50 p-1 text-left">
                  VARIETY
                </th>

                <th className="border-r border-green-600/50 p-1 text-center">
                  QTY
                </th>

                <th className="border-r border-green-600/50 p-1 text-right">
                  RATE
                </th>

                <th className="p-1 text-right">
                  AMOUNT
                </th>

              </tr>
            </thead>

            <tbody>

              {entries.map((entry: any, index: number) => (
                <tr key={index} className="h-4">

                  <td className="border-r border-green-600/50 px-1 py-0.5">
                    {entry.type}
                  </td>

                  <td className="border-r border-green-600/50 px-1 py-0.5">
                    {entry.variety}
                  </td>

                  <td className="border-r border-green-600/50 px-1 py-0.5 text-center">
                    {entry.qty}
                  </td>

                  <td className="border-r border-green-600/50 px-1 py-0.5 text-right">
                    {entry.isForwarded
                      ? 'Forwarded'
                      : money(entry.rate)}
                  </td>

                  <td className="px-1 py-0.5 text-right font-semibold">
                    {entry.isForwarded
                      ? 'Forwarded'
                      : money(entry.total)}
                  </td>

                </tr>
              ))}

              {emptyRows.map((_, index) => (
                <tr key={`empty-${index}`} className="h-4">

                  <td className="border-r border-green-600/50 px-1 py-0.5">
                    &nbsp;
                  </td>

                  <td className="border-r border-green-600/50 px-1 py-0.5" />

                  <td className="border-r border-green-600/50 px-1 py-0.5" />

                  <td className="border-r border-green-600/50 px-1 py-0.5" />

                  <td className="px-1 py-0.5" />

                </tr>
              ))}

            </tbody>

          </table>

        </main>

        {/* FOOTER */}
        <footer className="pt-1 text-xs">

          <div className="grid grid-cols-2 gap-x-2">

            {/* LEFT */}
            <div className="flex flex-col justify-between space-y-0.5 pr-4">

              <div>

                <p>
                  <strong>Total Quantity:</strong>{' '}
                  {totals?.totalQty || 0}{' '}
                  (Patti: {totals?.pattiQty || 0}, Dabba:{' '}
                  {totals?.dabbaQty || 0})
                </p>

                <div className="mt-2 flex items-end gap-4">
                  <BusinessCardQR size={92} />
                </div>

              </div>

            </div>

            {/* RIGHT */}
            <div className="space-y-0.5 border-l-2 border-green-700 pl-4 text-[10px]">

              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  {money(totals?.subtotal)}
                </span>
              </div>

              <div className="flex justify-between border-t border-gray-400 font-bold">
                <span>Gross Sale:</span>
                <span>
                  {money(totals?.grossSale)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Freight:</span>
                <span>
                  - {money(freight)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Labour:</span>
                <span>
                  - {money(totals?.labour)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Association:</span>
                <span>
                  - {money(totals?.association)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Security:</span>
                <span>
                  - {money(totals?.security)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Commission:</span>
                <span>
                  - {money(totals?.commissionAmount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>S. Charges:</span>
                <span>
                  -{' '}
                  {money(
                    totals?.securityCharges ??
                      totals?.serviceCharges ??
                      0
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Postage:</span>
                <span>
                  - {money(totals?.postage ?? 0)}
                </span>
              </div>

              <div className="flex justify-between border-t border-gray-400 font-bold">
                <span>Total Exp:</span>
                <span>
                  - {money(totals?.totalExpenses)}
                </span>
              </div>

              <div className="flex justify-between border-t border-gray-400 text-base font-bold">
                <span>Net Sale:</span>
                <span>
                  {money(totals?.netSale)}
                </span>
              </div>

            </div>

          </div>

          {/* SIGNATURE */}
          <div className="mt-1 flex items-end justify-end">

            <div className="text-center">
              <p className="font-signature text-2xl text-gray-700">
                Faisal
              </p>

              <p className="-mt-2 text-[10px] font-bold">
                Sign. Of Manager
              </p>
            </div>

          </div>

        </footer>

      </div>
    </div>
  );
};




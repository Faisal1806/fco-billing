import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FcoDocument from '@/lib/models/document';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const backupData = await req.json();
    const entries = Object.entries(backupData);
    let saved = 0; let skipped = 0;

    for (const [key, value] of entries) {
      if (key === 'userRole' || !value || typeof value !== 'object') { skipped++; continue; }
      await FcoDocument.findOneAndUpdate(
        { key },
        { key, value: value as Record<string, unknown> },
        { upsert: true, new: true }
      );
      saved++;
    }
    return NextResponse.json({ success: true, message: `${saved} saved, ${skipped} skipped` });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Migration failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const total = await FcoDocument.countDocuments();
    const invoices = await FcoDocument.countDocuments({ key: { $regex: '^invoice-' } });
    const purchases = await FcoDocument.countDocuments({ key: { $regex: '^purchase-' } });
    const receipts = await FcoDocument.countDocuments({ key: { $regex: '^receipt-' } });
    const parties = await FcoDocument.countDocuments({ key: { $regex: '^party-' } });
    return NextResponse.json({ success: true, counts: { total, invoices, purchases, receipts, parties } });
    } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

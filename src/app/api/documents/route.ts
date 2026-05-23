import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FcoDocument from '@/lib/models/document';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const prefix = searchParams.get('prefix');
    if (key) {
      const doc = await FcoDocument.findOne({ key });
      if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: doc.value });
    }
    if (prefix) {
      const docs = await FcoDocument.find({ key: { $regex: `^${prefix}` } }).sort({ updatedAt: -1 });
      return NextResponse.json({ success: true, data: docs.map(d => ({ key: d.key, ...d.value })) });
    }
    const docs = await FcoDocument.find({}).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: docs.map(d => ({ key: d.key, ...d.value })) });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { key, value } = await req.json();
    if (!key || !value) return NextResponse.json({ success: false, error: 'key and value required' }, { status: 400 });
    const doc = await FcoDocument.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
    return NextResponse.json({ success: true, data: doc.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ success: false, error: 'key required' }, { status: 400 });
    await FcoDocument.deleteOne({ key });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

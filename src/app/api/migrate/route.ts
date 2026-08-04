import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FcoDocument from '@/lib/models/document';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const key = searchParams.get('key');
    const prefix = searchParams.get('prefix');

    // GET ONE DOCUMENT
    if (key) {
      const doc = await FcoDocument.findOne({ key }).lean();

      if (!doc) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: doc.value,
      });
    }

    // GET DOCUMENTS BY PREFIX
    const query = prefix
      ? {
          key: {
            $regex: `^${prefix}`,
          },
        }
      : {};

    const docs = await FcoDocument
      .find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: docs.map(doc => ({
        key: doc.key,
        ...(doc.value as Record<string, unknown>),
      })),
    });
  } catch (error) {
    console.error('GET /api/documents ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'key and value are required',
        },
        { status: 400 }
      );
    }

    const doc = await FcoDocument.findOneAndUpdate(
      { key },
      {
        key,
        value,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      data: doc?.value,
    });
  } catch (error) {
    console.error('POST /api/documents ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: 'key is required',
        },
        { status: 400 }
      );
    }

    await FcoDocument.deleteOne({ key });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE /api/documents ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}

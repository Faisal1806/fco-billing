import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FcoDocument from '@/lib/models/document';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET
 *
 * GET /api/documents?key=purchase-123
 * GET /api/documents?prefix=purchase-
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const key = searchParams.get('key');
    const prefix = searchParams.get('prefix');

    // Get one document
    if (key) {
      const document = await FcoDocument.findOne({ key }).lean();

      if (!document) {
        return NextResponse.json(
          {
            success: false,
            error: 'Document not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: document.value,
      });
    }

    // Get documents by prefix
    const query = prefix
      ? {
          key: {
            $regex: `^${escapeRegex(prefix)}`,
          },
        }
      : {};

    const documents = await FcoDocument.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: documents.map((document: any) => ({ ...document.value, id: document.key, key: document.key, value: document.value })),
    });
  } catch (error) {
    console.error('GET /api/documents failed:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Save/update one document.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const { key, value } = body;

    if (
      typeof key !== 'string' ||
      !key.trim() ||
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid key and value are required',
        },
        { status: 400 }
      );
    }

    const cleanKey = key.trim();

    const document = await FcoDocument.findOneAndUpdate(
      { key: cleanKey },
      {
        $set: {
          value,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      data: document?.value,
    });
  } catch (error) {
    console.error('POST /api/documents failed:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 *
 * DELETE /api/documents?key=purchase-123
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const key = searchParams.get('key');

    if (!key || !key.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'key is required',
        },
        { status: 400 }
      );
    }

    const result = await FcoDocument.deleteOne({
      key: key.trim(),
    });

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount > 0,
    });
  } catch (error) {
    console.error('DELETE /api/documents failed:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import connectDB, {
  getMongoConfigurationDiagnostics,
} from '@/lib/mongodb';
import FcoDocument from '@/lib/models/document';


function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSafeDatabaseError(error: unknown): string {
  const errorName =
    error instanceof Error ? error.name : '';
  const errorMessage =
    error instanceof Error ? error.message : '';

  if (
    errorName === 'MongoParseError' &&
    /Invalid scheme|Invalid connection string/i.test(errorMessage)
  ) {
    return 'MongoDB connection string is invalid. Check the server MONGODB_URI configuration.';
  }

  if (
    errorName === 'MongoServerSelectionError' ||
    errorName === 'MongoNetworkError'
  ) {
    return 'MongoDB connection failed. Check the server connection and database access.';
  }

  return 'MongoDB request failed. Check the server configuration and logs.';
}

/**
 * GET
 *
 * GET /api/documents?key=purchase-123
 * GET /api/documents?prefix=purchase-
 */
export async function GET(req: NextRequest) {
  try {
    const db = await connectDB();

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloud sync is not configured: MONGODB_URI is missing.',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);

    const key = searchParams.get('key');
    const prefixes = [...new Set(
      searchParams.getAll('prefix')
        .map(value => value.trim())
        .filter(Boolean)
    )];

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

    // Get documents matching one or more requested prefixes.
    // No prefix means the caller explicitly requested the full collection.
    const prefixConditions = prefixes.map(prefix => ({
      key: {
        $regex: `^${escapeRegex(prefix)}`,
      },
    }));

    const query = prefixConditions.length === 1
      ? prefixConditions[0]
      : prefixConditions.length > 1
        ? { $or: prefixConditions }
        : {};

    const documents = await FcoDocument.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: documents.map((document: any) => ({ ...document.value, id: document.key, key: document.key, value: document.value })),
    });
  } catch (error) {
    const isPreviewParseError =
      process.env.VERCEL_ENV === 'preview' &&
      error instanceof Error &&
      error.name === 'MongoParseError' &&
      /Invalid scheme|Invalid connection string/i.test(
        error.message
      );

    console.error(
      'GET /api/documents failed:',
      error instanceof Error ? error.name : 'Unknown error'
    );

    return NextResponse.json(
      {
        success: false,
        error: getSafeDatabaseError(error),
        ...(isPreviewParseError
          ? {
              diagnostics: getMongoConfigurationDiagnostics(),
            }
          : {}),
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
    const db = await connectDB();

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloud sync is not configured: MONGODB_URI is missing.',
        },
        { status: 503 }
      );
    }

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
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      data: document?.value,
    });
  } catch (error) {
    console.error(
      'POST /api/documents failed:',
      error instanceof Error ? error.name : 'Unknown error'
    );

    return NextResponse.json(
      {
        success: false,
        error: getSafeDatabaseError(error),
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
    const db = await connectDB();

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloud sync is not configured: MONGODB_URI is missing.',
        },
        { status: 503 }
      );
    }

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
    console.error(
      'DELETE /api/documents failed:',
      error instanceof Error ? error.name : 'Unknown error'
    );

    return NextResponse.json(
      {
        success: false,
        error: getSafeDatabaseError(error),
      },
      { status: 500 }
    );
  }
}

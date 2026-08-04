import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FcoDocument from '@/lib/models/document';


export async function GET(
  req: NextRequest
) {
  try {
    await connectDB();

    const {
      searchParams,
    } = new URL(req.url);

    const key = searchParams.get('key');
    const prefix = searchParams.get('prefix');


    if (key) {
      const document =
        await FcoDocument.findOne({ key }).lean();

      if (!document) {
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
        data: document.value,
      });
    }


    let documents;

    if (prefix) {
      documents =
        await FcoDocument.find({
          key: {
            $regex: `^${escapeRegex(prefix)}`,
          },
        })
        .sort({ updatedAt: -1 })
        .lean();
    } else {
      documents =
        await FcoDocument.find({})
          .sort({ updatedAt: -1 })
          .lean();
    }


    return NextResponse.json({
      success: true,
      data: documents.map(document => ({
        key: document.key,
        value: document.value,
      })),
    });

  } catch (error) {
    console.error(
      'GET /api/documents failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}


export async function POST(
  req: NextRequest
) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      key,
      value,
    } = body;


    if (
      typeof key !== 'string' ||
      !key.trim() ||
      !value ||
      typeof value !== 'object'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid key and value are required',
        },
        { status: 400 }
      );
    }


    const document =
      await FcoDocument.findOneAndUpdate(
        { key },
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
    console.error(
      'POST /api/documents failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest
) {
  try {
    await connectDB();

    const {
      searchParams,
    } = new URL(req.url);

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


    await FcoDocument.deleteOne({
      key,
    });


    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(
      'DELETE /api/documents failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}


function escapeRegex(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

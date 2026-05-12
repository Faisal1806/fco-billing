import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Customer from "@/models/customer";

export async function POST(req) {
  try {
    await connectDB();

    const data = await req.json();

    if (data.customers) {
      await Customer.insertMany(data.customers);
    }

    return NextResponse.json({
      success: true,
      message: "Backup restored successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Restore failed",
      },
      { status: 500 }
    );
  }
}

import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

export async function POST(req) {
  await connectDB();

  const data = await req.json();

  const newCustomer = await Customer.create(data);

  return Response.json({
    message: "Customer Saved ✅",
    data: newCustomer,
  });
}

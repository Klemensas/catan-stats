import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  try {
    if (!file) throw new Error("Missing file");

    const res = await fetch(file);
    const data = await res.text();

    return new NextResponse(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";

    console.log("mmm", message);
    return new NextResponse(message, { status: 400 });
  }
}

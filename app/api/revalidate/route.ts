import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const secret = request.headers.get("x-revalidate-secret");
    const expectedSecret = process.env.REVALIDATE_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    const paths: string[] = body.paths ?? ["/"];

    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({ revalidated: true, paths });
  } catch {
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}

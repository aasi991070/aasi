import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const MAX_PATHS = 20;

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-revalidate-secret");
    const expectedSecret = process.env.REVALIDATE_SECRET;

    // Fail closed. The previous `if (expectedSecret && ...)` skipped the check
    // entirely when the env var was missing, which turned a misconfiguration
    // into an open cache-purge endpoint.
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const paths: unknown = body.paths ?? ["/"];

    if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string")) {
      return NextResponse.json(
        { message: "`paths` must be an array of strings" },
        { status: 400 }
      );
    }
    if (paths.length === 0) {
      return NextResponse.json(
        { message: "`paths` must not be empty" },
        { status: 400 }
      );
    }
    if (paths.length > MAX_PATHS) {
      return NextResponse.json(
        { message: `\`paths\` is limited to ${MAX_PATHS} entries` },
        { status: 400 }
      );
    }

    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({ revalidated: true, paths });
  } catch {
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}

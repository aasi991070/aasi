import { NextRequest, NextResponse } from "next/server";
import { createReview, getReviewsByProductId } from "@/lib/queries/reviews";
import { getProductById } from "@/lib/queries/products";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json({ message: "product_id required" }, { status: 400 });
  }

  const reviews = await getReviewsByProductId(productId);
  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product_id = String(body.product_id ?? "").trim();
    const author_name = String(body.author_name ?? "").trim();
    const rating = Number(body.rating);
    const reviewBody = String(body.body ?? "").trim();

    if (!product_id) {
      return NextResponse.json({ message: "Product is required" }, { status: 400 });
    }
    if (!author_name || author_name.length < 2 || author_name.length > 80) {
      return NextResponse.json(
        { message: "Name must be 2–80 characters" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }
    if (!reviewBody || reviewBody.length < 10 || reviewBody.length > 2000) {
      return NextResponse.json(
        { message: "Review must be 10–2000 characters" },
        { status: 400 }
      );
    }

    const product = await getProductById(product_id);
    if (!product?.is_active) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const review = await createReview({
      product_id,
      author_name,
      rating,
      body: reviewBody,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ message }, { status: 500 });
  }
}

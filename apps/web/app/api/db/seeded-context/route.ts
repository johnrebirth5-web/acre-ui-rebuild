import { getSeededWorkspaceSnapshot } from "@acre/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await getSeededWorkspaceSnapshot();

    if (!snapshot) {
      return NextResponse.json(
        {
          status: "not_found",
          message: "No workspace data is available yet. Finish setup and try again."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "ok",
      snapshot
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unavailable",
        message: "We couldn't load the workspace right now. Please check the database connection and try again.",
        error: error instanceof Error ? error.message : "Unknown database error"
      },
      { status: 503 }
    );
  }
}

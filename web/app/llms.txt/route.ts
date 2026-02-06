import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    // Read the llms.txt file from the root directory
    const llmsPath = join(process.cwd(), "..", "llms.txt");
    const llmsContent = await readFile(llmsPath, "utf-8");

    return new NextResponse(llmsContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error reading llms.txt:", error);
    return new NextResponse("llms.txt not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

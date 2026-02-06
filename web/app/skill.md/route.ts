import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    // Read the SKILL.md file from the root directory
    const skillPath = join(process.cwd(), "..", "SKILL.md");
    const skillContent = await readFile(skillPath, "utf-8");

    return new NextResponse(skillContent, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error reading SKILL.md:", error);
    return new NextResponse("SKILL.md not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

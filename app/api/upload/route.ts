import { put } from "@vercel/blob";
import { getServerSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createFileRecord } from "@/lib/db/actions";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
];

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  try {
    let url: string;
    let key: string | undefined;

    // Use Vercel Blob in production, local storage in development
    if (process.env.VERCEL_BLOB_TOKEN && process.env.NODE_ENV === "production") {
      const blob = await put(file.name, file, {
        access: "public",
        token: process.env.VERCEL_BLOB_TOKEN,
      });
      url = blob.url;
      key = blob.pathname;
    } else {
      // Local development: save to public/uploads
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fs = await import("fs/promises");
      const path = await import("path");
      
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, buffer);
      
      url = `/uploads/${filename}`;
      key = filename;
    }

    // Save file record to database
    const fileId = await createFileRecord({
      name: file.name,
      url,
      mimeType: file.type,
      size: file.size,
      key,
    });

    return NextResponse.json({
      id: fileId,
      url,
      name: file.name,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import Busboy from "busboy";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { ObjectPermission } from "../lib/objectAcl";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/direct
 *
 * Direct server-side upload via multipart/form-data.
 * Bypasses GCS CORS — the browser sends the file to our server,
 * the server saves it to object storage, returns objectPath + sourceUrl.
 */
router.post("/storage/uploads/direct", async (req: Request, res: Response) => {
  const ct = req.headers["content-type"] ?? "";
  if (!ct.includes("multipart/form-data")) {
    res.status(400).json({ error: "multipart/form-data required" });
    return;
  }

  const tmpPath = join(tmpdir(), `klipflow-upload-${randomUUID()}`);
  let fileName = "upload";
  let mimeType = "application/octet-stream";
  let fileSize = 0;

  try {
    await new Promise<void>((resolve, reject) => {
      const bb = Busboy({ headers: req.headers });
      const writeStream = createWriteStream(tmpPath);

      bb.on("file", (_field, stream, info) => {
        fileName = info.filename || "upload";
        mimeType = info.mimeType || "application/octet-stream";
        stream.on("data", (chunk: Buffer) => { fileSize += chunk.length; });
        stream.pipe(writeStream);
        stream.on("error", reject);
        writeStream.on("error", reject);
        writeStream.on("finish", resolve);
      });

      bb.on("error", reject);
      req.pipe(bb);
    });

    const subfolder = mimeType.startsWith("video/") ? "videos"
      : mimeType.startsWith("audio/") ? "audio"
      : mimeType.startsWith("image/") ? "images"
      : "uploads";

    const result = await objectStorageService.uploadFileToStorage(tmpPath, mimeType, subfolder);

    res.json({
      objectPath: result.objectPath,
      sourceUrl: `/api/storage${result.objectPath}`,
      metadata: { name: fileName, size: fileSize, contentType: mimeType },
    });
  } catch (err) {
    req.log.error({ err }, "Direct upload failed");
    res.status(500).json({ error: "Upload failed" });
  } finally {
    await rm(tmpPath, { force: true }).catch(() => {});
  }
});

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const rangeHeader = req.headers.range;
    const response = await objectStorageService.downloadObject(file, 3600, rangeHeader);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (uncomment when using replit-auth) ---
    // if (!req.isAuthenticated()) {
    //   res.status(401).json({ error: "Unauthorized" });
    //   return;
    // }
    // const canAccess = await objectStorageService.canAccessObjectEntity({
    //   userId: req.user.id,
    //   objectFile,
    //   requestedPermission: ObjectPermission.READ,
    // });
    // if (!canAccess) {
    //   res.status(403).json({ error: "Forbidden" });
    //   return;
    // }

    const rangeHeader = req.headers.range;
    const response = await objectStorageService.downloadObject(objectFile, 3600, rangeHeader);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;

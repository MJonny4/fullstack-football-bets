import express from "express";
import type { Request, Response } from "express";

export function createApp() {
    const app = express();

    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok" });
    });

    return app;
}
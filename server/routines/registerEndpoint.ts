import express from "express";
import { getIp } from "server/utils/requests";
import z from "zod";
import { runUnsafeFunction } from "./runners";

export const router = express.Router();

router.post("/routines/exec", async (req, res) => {
  const ip = getIp(req);

  console.log("Received request from IP:", ip);

  // ensure that the request is from a trusted source
  if (ip !== "127.0.0.1") {
    res.status(403).json({
      status: "error",
      message: "Request not from trusted source",
    });
    return;
  }

  try {
    // check if the request has the correct shape
    const body = z
      .object({
        exec: z.string(),
        args: z.array(z.any()),
        timeout: z.number().optional(),
      })
      .parse(req.body);

    await runUnsafeFunction({ req, res, body, ip });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: "Invalid request",
    });
    return;
  }
});

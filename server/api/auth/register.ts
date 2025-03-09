import express from "express";
import { userFromReq } from "./userFromReq.ts";

export const router = express.Router();

router.get("/", async (req, res) => {
  // load the user information from the request
  const user = await userFromReq(req);

  // send the user information back to the client
  res.json({ user });
});

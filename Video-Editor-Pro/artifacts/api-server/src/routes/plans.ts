import { Router } from "express";
import { db } from "@workspace/db";
import { plansTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router = Router();

router.get("/plans", async (req, res) => {
  try {
    const plans = await db.select().from(plansTable).orderBy(asc(plansTable.price));
    res.json(plans);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list plans" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import clipsRouter from "./clips";
import plansRouter from "./plans";
import dashboardRouter from "./dashboard";
import captionsRouter from "./openai/captions";
import ttsRouter from "./openai/tts";
import storageRouter from "./storage";
import exportRouter from "./export";
import stripeRouter from "./stripe";
import referralRouter from "./referral";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(projectsRouter);
router.use(clipsRouter);
router.use(plansRouter);
router.use(dashboardRouter);
router.use(captionsRouter);
router.use(ttsRouter);
router.use(exportRouter);
router.use(stripeRouter);
router.use(referralRouter);

export default router;

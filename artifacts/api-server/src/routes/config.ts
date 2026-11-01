import { Router, type IRouter } from "express";
import { allowedEmailDomains, enabledSocialProviders } from "../auth";

const router: IRouter = Router();

// Public: tells the sign-in screen which options to show.
router.get("/config", (_req, res) => {
  res.json({
    socialProviders: enabledSocialProviders,
    allowedEmailDomains,
  });
});

export default router;

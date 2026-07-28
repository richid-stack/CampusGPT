import { Router, type IRouter } from "express";
import healthRouter from "./health";
import threadsRouter from "./threads";
import messagesRouter from "./messages";
import chatRouter from "./chat";
import documentsRouter from "./documents";
import timetableRouter from "./timetable";
import eventsRouter from "./events";
import notificationsRouter from "./notifications";
import plannerRouter from "./planner";
import userRouter from "./user";
import digestRouter from "./digest";
import sttRouter from "./stt";
import ttsRouter from "./tts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(threadsRouter);
router.use(messagesRouter);
router.use(chatRouter);
router.use(sttRouter);
router.use(ttsRouter);
router.use(documentsRouter);
router.use(timetableRouter);
router.use(eventsRouter);
router.use(notificationsRouter);
router.use(plannerRouter);
router.use(userRouter);
router.use(digestRouter);

export default router;

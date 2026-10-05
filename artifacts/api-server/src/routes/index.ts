import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import skillsRouter from "./skills";
import questionsRouter from "./questions";
import workbenchRouter from "./workbench";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(skillsRouter);
router.use(questionsRouter);
router.use(workbenchRouter);

export default router;

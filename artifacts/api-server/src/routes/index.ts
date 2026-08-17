import { Router, type IRouter } from "express";
import healthRouter from "./health";
import finditRouter from "./findit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(finditRouter);

export default router;

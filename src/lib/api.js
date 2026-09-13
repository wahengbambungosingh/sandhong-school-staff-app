import { IS_LIVE } from "../config.js";
import { demoApi } from "./api.demo.js";
import { liveApi } from "./api.live.js";

export const api = IS_LIVE ? liveApi : demoApi;
export { IS_LIVE };

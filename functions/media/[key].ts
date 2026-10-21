/* GET /media/<key> → a photo or video. */
import { handle, type Ctx } from "../../server/core";
import { serveMedia } from "../../server/media";

export const onRequestGet = handle(async ({ env, params, request }: Ctx) => serveMedia(env, String(params?.key ?? ""), request));

import { MediaService } from "@/lib/services/media.service";
import { R2Service } from "@/lib/services/r2.service";

export const r2Service = new R2Service();
export const mediaService = new MediaService(r2Service);

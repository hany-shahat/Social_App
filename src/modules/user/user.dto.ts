import {z} from "zod";
import { logout } from "./user.validation";

export type IlogoutDto = z.infer<typeof logout.body>;
import {z} from "zod";
import { freezeAccount, hardDelete, logout, restoreAcount, UpdateBasicInfo, UpdateEmail, UpdatePassword } from "./user.validation";

export type IlogoutDto = z.infer<typeof logout.body>;
export type IFreezeAccountDto = z.infer<typeof freezeAccount.params>;
export type IRestoreAccountDto = z.infer<typeof restoreAcount.params>;
export type IHardDeleteAccountDto = z.infer<typeof hardDelete.params>;
export type IUpdatePasswordDto = z.infer<typeof UpdatePassword.body>;
export type IUpdateBasicInfoDto = z.infer<typeof UpdateBasicInfo.body>;
export type IUpdateEmailDto = z.infer<typeof UpdateEmail.body>;


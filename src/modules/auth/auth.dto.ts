// export interface IsignupBodyInputsDTto{
//     userName: string,
//     email: string,
//     password:string
// }
import * as validators from "./auth.validation"
import { z } from "zod";
export type IsignupBodyInputsDTto = z.infer<typeof validators.signup.body>
export type ISigninBodyInputsDTO = z.infer<typeof validators.signin.body>;
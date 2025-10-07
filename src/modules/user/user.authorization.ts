import { RoleEnum } from "../../DB/models/User.model";



export const endpoint = {
    profile: [RoleEnum.user],
    restoreAccount: [ RoleEnum.admin],
    hardDelete: [ RoleEnum.admin ,RoleEnum.user],
    dashboard: [RoleEnum.admin, RoleEnum.superAdmin],
     welcome: [RoleEnum.user,RoleEnum.admin],
}
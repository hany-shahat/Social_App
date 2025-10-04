// import { HChatDocument } from "../../DB/models";
import { HUserDocument } from "../../DB/models/User.model";

export interface IProfileImageResponse{
    url: string;
}
export interface IProfileCoverImage {
    user: Partial<HUserDocument>;
    //  group?: Partial<HChatDocument>|[];
}
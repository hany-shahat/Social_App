import { EventEmitter } from "node:events";
import { deleteFile, getFile } from "./s3.config";
import { UserRepository } from "../../DB/repository/user.repository";
import { HUserDocument, UserModel } from "../../DB/models/User.model";
import { UpdateQuery } from "mongoose";

export const s3Event = new EventEmitter({});


s3Event.on("trackProfileImageUpload", (data) => {
    console.log({ data });
    setTimeout(async () => {
        const userModel=new UserRepository(UserModel)
        try {
            await getFile({ Key: data.Key })
            await userModel.updateOne({
                filter: { _id: data.userId },
                update:{$unset:{temProfileImage:1}}
            })
            await deleteFile({Key:data.oldKey})
            console.log(`Done`);
           
        } catch (error : any) {
            console.log(error);
            console.log({ed:data});
            
            if (error.Code === "NoSuchKey") {
                let unsetData: UpdateQuery<HUserDocument> = { temProfileImage: 1 };
                if (!data.oldKey) {
                    unsetData ={temProfileImage: 1,profileImage:1}
                }
               await userModel.updateOne({
                filter: { _id: data.userId },
                   update: {
                   profileImage:data.oldKey ,
                       $unset: unsetData
                   }
            }) 
            }
        }
    }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS)*1000);
})
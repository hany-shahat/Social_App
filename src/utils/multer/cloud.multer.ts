import {v4 as uuid  } from "uuid";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { badRequestException } from "../response/error.response";
import os from "node:os"
export enum StorageEnum{
    memory = "memory",
    disk = "disk"
}
export const fileValidation = {
    image:["image/jpeg" , "image/png" ,  "image/avif","image/gif"]
}
export const cloudFileUpload = ({
    validation = [],
    storageApproach = StorageEnum.memory,
    mixSizeMB = 2
}: {
    validation?: string[];
        storageApproach?: StorageEnum;
        mixSizeMB?:number
}): multer.Multer => {
    const storage = storageApproach === StorageEnum.memory ? multer.memoryStorage()
        : multer.diskStorage({
            destination: os.tmpdir(),
            filename: function (req: Request, file: Express.Multer.File, callback) {
                callback(null , `$${uuid()}_${file.originalname}`)
            }
         });
    
    function fileFilter(
        req: Request,
        file: Express.Multer.File,
        callback:FileFilterCallback
        
    ) {
        if (!validation.includes(file.mimetype)) {
            return callback(
                new badRequestException("Validation error", {
                    validationErrors: [
                        {
                            key: file,
                            issues:[{path:"file" , message:"In-vaild file format"}]
        }
    ]
})
            )
        }
       return callback(null , true)
    }
    return multer({fileFilter,limits:{fieldSize:mixSizeMB*1024*1024},storage})
}
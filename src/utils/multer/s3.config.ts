import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, DeleteObjectsCommandOutput, GetObjectCommand, GetObjectCommandOutput, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { StorageEnum } from "./cloud.multer";
import { v4 as uuid } from "uuid";
import { createReadStream } from "node:fs";
import { badRequestException } from "../response/error.response";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


export const s3Config = ()=> {
     return new S3Client({
        region: process.env.AWS_REGION as string,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY as string
        }
    })
}
export const uploadFile =async ({
    storageApproach = StorageEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    file,
    
}: {
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File
}):Promise<string> => {
    

    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}_${file.originalname}`,
        Body: storageApproach === StorageEnum.memory ? file.buffer : createReadStream(file.path),
        ContentType:file.mimetype
    })
    await s3Config().send(command)
    if (!command?.input?.Key) {
        throw new badRequestException("fail to generate upload key")
    }
    return command.input.Key

}
export const uploadFiles =async ({
    storageApproach = StorageEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    files,
    
}: {
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[]
}):Promise<string[]> => {
    let urls: string[] = []; 
    urls = await Promise.all(files.map((file) => {
        return uploadFile({
         storageApproach,
         Bucket,
         ACL,
         path,
         file,
     })
    }))
// for (const file of files) {
//     const key = await uploadFile({
//         storageApproach,
//         Bucket,
//         ACL,
//         path,
//         file,
//     })
//     urls.push(key)
//     }
    return urls
}
export const uploadLargeFile =async ({
    storageApproach = StorageEnum.disk,
    Bucket = process.env.AWS_BUCKET_NAME,
    ACL = "private",
    path = "general",
    file,
    
}: {
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File
}):Promise<string> => {
    
    const upload = new Upload({
        client: s3Config(),
        params: {
            
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}_${file.originalname}`,
        Body: storageApproach === StorageEnum.memory ? file.buffer : createReadStream(file.path),
        ContentType:file.mimetype
        }
})
    upload.on("httpUploadProgress", (progress) => {
    console.log(`Upload file progress is ::: `,progress);
    })
    const { Key } = await upload.done();
     if (!Key) {
        throw new badRequestException("fail to generate upload key")
    }
    return Key;
}
export const uploadLargeFiles =async ({
    storageApproach = StorageEnum.disk,
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = "private",
    path = "general",
    files,
    
}: {
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[]
}):Promise<string[]> => {
    let urls: string[] = []; 
    urls = await Promise.all(files.map((file) => {
        return uploadLargeFile({
         storageApproach,
         Bucket,
         ACL,
         path,
         file,
     })
    }))
// for (const file of files) {
//     const key = await uploadFile({
//         storageApproach,
//         Bucket,
//         ACL,
//         path,
//         file,
//     })
//     urls.push(key)
//     }
    return urls
}
export const createPreSignedLink = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path = "general",
    expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS),
    ContentType,
     Originalname,
}: {
        Bucket?: string,
        path?: string,
        expiresIn?: number,
        ContentType: string,
        Originalname: string,
    
}):Promise<{url:string,Key:string}> => {
    

    const command = new PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}_pre_${Originalname}`,
        ContentType
})
    const url = await getSignedUrl(s3Config(), command, { expiresIn });
if (!url || !command?.input?.Key) {
    throw new badRequestException("Fail to create pre signed url")
}
    return {url,Key:command.input.Key}
}
export const createGetPreSignedLink = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
   Key,
    expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS),
}: {
        Bucket?: string,
        Key: string,
        expiresIn?: number,
}):Promise<string> => {
     const command = new GetObjectCommand({
        Bucket,
        Key,
})
    const url = await getSignedUrl(s3Config(), command, { expiresIn });
if (!url) {
    throw new badRequestException("Fail to create pre signed url")
}
    return url
}
/* export const createGetPreSignedLink = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
   Key,
    expiresIn = 120,
    downloadName = "dummy",
    download = "false",
}: {
        Bucket?: string,
        Key: string,
        expiresIn?: number,
        downloadName?: string,
    download?:string,
}):Promise<string> => {
    

    const command = new GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition:download === "true"?`attachment; filename="${downloadName||Key.split("/").pop()}"`:undefined
})
    const url = await getSignedUrl(s3Config(), command, { expiresIn });
if (!url) {
    throw new badRequestException("Fail to create pre signed url")
}
    return url
} */
export const getFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key,
}: {
        Bucket?: string,
    Key:string
}):Promise<GetObjectCommandOutput> => {
     const command = new GetObjectCommand({
        Bucket,
        Key,
    })
    return await s3Config().send(command)
}

export const deleteFile = async ({
    Bucket=process.env.AWS_BUCKET_NAME as string,
    Key,
}: {
        Bucket?: string,
    Key:string,
}):Promise<DeleteObjectCommandOutput> => {
    const command = new DeleteObjectCommand({
        Bucket,
        Key,
    })
    return await s3Config().send(command)
}

export const deleteFiles = async ({
        Bucket = process.env.AWS_BUCKET_NAME as string,
    urls,
        Quiet = false,
}: {
        Bucket?: string,
        urls: string[],
    Quiet?:boolean,
    }):Promise<DeleteObjectsCommandOutput> => {
    
    const Objects = urls.map((url) => {
    return {Key:url}
})
    const command = new DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet,
        }

    })
    return s3Config().send(command)
}

export const listDirectoryFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path,
}: {
        Bucket?: string,
    path:string,
}) => {
    
    const command = new ListObjectsV2Command({
        Bucket,
        Prefix:`${process.env.APPLICATION_NAME}/${path}`
    })
    return s3Config().send(command)
}
export const deleteFolder = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path,
    Quiet=false,
}: {
        Bucket?: string,
        path: string,
    Quiet?:boolean,
}) => {
    
    const fileList = await listDirectoryFiles({
        Bucket,
        path,
            })
            if (!fileList?.Contents?.length) {
                throw new badRequestException("empty directy")
            }
            const urls: string[] = fileList.Contents.map((file) => {
                return file.Key as string
            })
          return  await deleteFiles({urls,Bucket,Quiet})
}
import { CreateOptions, HydratedDocument, Model } from "mongoose";
import { IUser as TDocment } from "../models/User.model";
import { DatabaseRepository } from "./database.repository";
import { badRequestException } from "../../utils/response/error.response";



export class UserRepository extends DatabaseRepository<TDocment>{
    constructor(protected override readonly model: Model<TDocment>) {
        super(model);
    }
      async createUser({
            data,
            options,
        }: {
                data: Partial<TDocment>[];
                options?: CreateOptions;
            }): Promise<HydratedDocument<TDocment>>{
            const [user] = (await this.create({ data, options })) || []
            if (!user) {
                throw new badRequestException("Fail to create this user")
            }
            return user;
        }
}
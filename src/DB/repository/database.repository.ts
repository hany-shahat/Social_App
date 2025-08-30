import { CreateOptions, FlattenMaps, HydratedDocument, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery, UpdateWriteOpResult } from "mongoose";
export type lean<T> = HydratedDocument<FlattenMaps<T>>
export abstract class DatabaseRepository<TDocment>{
    constructor(protected readonly model: Model<TDocment>) { }
    async findOne({
        filter,
        select,
        options,
    }: {
            filter?: RootFilterQuery<TDocment>,
            select?: ProjectionType<TDocment> | null,
        options?:QueryOptions<TDocment> | null,
        }): Promise<lean<TDocment>|HydratedDocument<TDocment> | null>{
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean){
            doc.lean(options.lean)
        }
        return await doc.exec()
    }
    async create({
        data,
        options,
    }: {
            data: Partial<TDocment>[];
            options?: CreateOptions | undefined;
        }): Promise<HydratedDocument<TDocment>[] | undefined>{
        return await this.model.create(data , options)
    }
    async updateOne({
        filter,
        update,
        options,
    }: {
            filter: RootFilterQuery<TDocment>
            update: UpdateQuery<TDocment>
            options?: MongooseUpdateQueryOptions<TDocment> | null;
        }): Promise<UpdateWriteOpResult>{
        return await this.model.updateOne(filter,{...update,$inc:{__v:1}},options)
    }
}
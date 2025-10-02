import { CreateOptions, DeleteResult, FlattenMaps, HydratedDocument, Model, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery, UpdateWriteOpResult } from "mongoose";
import { Types } from "mongoose";
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
    async find({
        filter,
        select,
        options,
    }: {
            filter?: RootFilterQuery<TDocment>,
            select?: ProjectionType<TDocment> | undefined,
        options?:QueryOptions<TDocment> | undefined,
        }): Promise<HydratedDocument<TDocment> []|[]|lean<TDocment>[]>{
        const doc = this.model.find(filter||{}).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate as PopulateOptions[]);
        }
        if (options?.lean){
            doc.lean(options.lean)
        }
         if (options?.skip){
             doc.skip(options.skip)
         }
         if (options?.limit){
             doc.limit(options.limit)
        }
        
//         if (typeof options?.skip === "number") {
//     doc.skip(options.skip);
// }

// if (typeof options?.limit === "number") {
//     doc.limit(options.limit);
// }

        return await doc.exec()
    }
    async paginate({
        filter={},
        select,
        options ={},
        page = "all",
        size = 5,
        
    }: {
            filter: RootFilterQuery<TDocment>,
            select?: ProjectionType<TDocment> | undefined,
            options?: QueryOptions<TDocment> | undefined,
            page?: number | "all",
            size?: number,
        
        }): Promise<HydratedDocument<TDocment>[] | [] | lean<TDocment>[] | any>{
        let docsCount: number | undefined = undefined;
        let pages: number | undefined = undefined;
        if (page !== "all") {
            page = Math.floor(page < 1 ? 1 : page);

        options.limit = Math.floor(page < 1 || !size ? 5 : size);
        
            options.skip = (page - 1) * options.limit;
            console.log(await this.model.countDocuments(filter));
            docsCount = await this.model.countDocuments(filter)
            pages=Math.ceil(docsCount/options.limit)
        }
       const result =await this.find({filter , select , options})
        return {docsCount,limit:options.limit,pages,currentPage:page,result};
    }
    async findById({
       id,
        select,
        options,
    }: {
            id:string | Types.ObjectId,
            select?: ProjectionType<TDocment> | null,
        options?:QueryOptions<TDocment> | null,
        }): Promise<lean<TDocment>|HydratedDocument<TDocment> | null>{
        const doc = this.model.findById(id).select(select || "");
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
    async insertMany({
        data,
    }: {
            data: Partial<TDocment>[];
            options?: CreateOptions | undefined;
        }): Promise<HydratedDocument<TDocment>[]>{
        return await this.model.insertMany(data ) as HydratedDocument<TDocment>[]
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
        if (Array.isArray(update)) {
            update.push({
                $set: { __v: { $add: ["$__v", 1] }, },
            });
             return await this.model.updateOne(filter||{},update,options)
        }
        return await this.model.updateOne(filter || {},{...update,$inc:{__v:1}},options)
    }
    async deleteOne({
        filter,
    }: {
            filter: RootFilterQuery<TDocment>
        }): Promise<DeleteResult>{
        return await this.model.deleteOne(filter)
    }
    async deleteMany({
        filter,
    }: {
            filter: RootFilterQuery<TDocment>
        }): Promise<DeleteResult>{
        return await this.model.deleteMany(filter)
    }
    async findOneAndDelete({
        filter,
    }: {
            filter: RootFilterQuery<TDocment>
        }): Promise<HydratedDocument<TDocment> | null>{
        return await this.model.findOneAndDelete(filter)
    }
    async findByIdAndUpdate({
        id,
        update,
        options = {new : true},
    }: {
            id: Types.ObjectId | string;
            update: UpdateQuery<TDocment>
            options?: QueryOptions<TDocment> | null;
        }): Promise<HydratedDocument<TDocment> | lean <TDocment> | null>{
        return await this.model.findByIdAndUpdate(id,{...update,$inc:{__v:1}},options)
    }
    async findOneAndUpdate({
        filter,
        update,
        options = {new : true},
    }: {
            filter?: RootFilterQuery<TDocment>
            update: UpdateQuery<TDocment>
            options?: QueryOptions<TDocment> | null;
        }): Promise<HydratedDocument<TDocment> | lean <TDocment> | null>{
        return await this.model.findOneAndUpdate(filter,{...update,$inc:{__v:1}},options)
    }
    async updateMany({
  filter,
  update,
  options,
}: {
  filter: RootFilterQuery<TDocment>;
  update: UpdateQuery<TDocment>;
  options?: MongooseUpdateQueryOptions<TDocment> | null;
}): Promise<UpdateWriteOpResult> {
  if (Array.isArray(update)) {
    update.push({
      $set: { __v: { $add: ["$__v", 1] } },
    });
    return await this.model.updateMany(filter || {}, update, options);
  }
  return await this.model.updateMany(filter || {}, { ...update, $inc: { __v: 1 } }, options);
}

}
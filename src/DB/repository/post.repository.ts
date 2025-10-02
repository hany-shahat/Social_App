import { HydratedDocument, Model, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery } from "mongoose";
// import { IPost as TDocument } from "../models/Post.model";
import { DatabaseRepository, lean } from "./database.repository";
import { CommentRepository } from "./comment.repository";
import { CommentModel ,IPost as TDocument} from "../models";



export class PostRepository extends DatabaseRepository<TDocument> {
     private commentModel = new CommentRepository(CommentModel)
    constructor(protected override readonly model: Model<TDocument>) {
        super(model)
    }
    async findCrusor ({
            filter,
            select,
            options,
        }: {
                filter?: RootFilterQuery<TDocument>,
                select?: ProjectionType<TDocument> | undefined,
            options?:QueryOptions<TDocument> | undefined,
        }): Promise<HydratedDocument<TDocument>[] | [] | lean<TDocument>[] | any>{
        let result = [];
        const cursor = this.model.find(filter || {}).select(select || "")
            .populate(options?.populate as PopulateOptions[])
            .cursor();
        for (
            let doc = await cursor.next();
            doc != null;
            doc = await cursor.next()
        ){
            const comments = await this.commentModel.find({
             filter: { postId: doc._id , commentId:{$exists:false}}
         });
         result.push({post:doc,comments})
         }
          
        return result;
        }
}
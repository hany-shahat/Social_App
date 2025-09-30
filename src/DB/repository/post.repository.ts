import { Model } from "mongoose";
import { IPost as IDocument } from "../models/Post.model";
import { DatabaseRepository } from "./database.repository";



export class PostRepository extends DatabaseRepository<IDocument> {
    constructor(protected override readonly model: Model<IDocument>) {
    super(model)
}
}
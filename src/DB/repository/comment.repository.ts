import { Model } from "mongoose";
import { IComment as IDocument } from "../models";
import { DatabaseRepository } from "./database.repository";



export class CommentRepository extends DatabaseRepository<IDocument> {
    constructor(protected override readonly model: Model<IDocument>) {
    super(model)
}
}
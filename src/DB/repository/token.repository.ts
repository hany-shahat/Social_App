import { Model } from "mongoose";
import { IToken as IDocument } from "../models/Token.model";
import { DatabaseRepository } from "./database.repository";



export class TokenRepository extends DatabaseRepository<IDocument> {
    constructor(protected override readonly model: Model<IDocument>) {
    super(model)
}
}
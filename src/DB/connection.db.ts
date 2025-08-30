import {connect} from "mongoose";
import { UserModel } from "./models/User.model";
const connectDB = async ():Promise <void> => {
  try {
    const result = await connect(process.env.DB_URI as string, { serverSelectionTimeoutMS: 30000 });
    await UserModel.syncIndexes();
    console.log(result.models);
    console.log(`DB connected successfully`);
    
  } catch (error) {
    console.error("❌ Error connecting to DB:", error);
  }
};
export default connectDB;

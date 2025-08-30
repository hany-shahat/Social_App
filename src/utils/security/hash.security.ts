import { compare, hash } from "bcrypt"
export const generateHash = (plaintext: string, salt: number = Number(process.env.SALT)): Promise<string> => {
    return hash(plaintext, salt);
};
export const compareHash = (plaintext: string, hash:string): Promise<boolean> => {
    return compare(plaintext, hash);
};
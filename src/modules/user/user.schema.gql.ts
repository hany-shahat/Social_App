import * as gqlTypes from "./user.types.gql"
import * as gqlArgs from "./user.args"
import { UserResolver } from './user.resolver';
import { GraphQLNonNull, GraphQLString } from "graphql";




class UserGQLScema{
    private userResolver: UserResolver = new UserResolver();
    constructor() { }
    

    registerQuery=() => {
        return {
                       sayHi: {
                type: gqlTypes.welcome,
                args: { name: { type: new GraphQLNonNull(GraphQLString) } },
                description: "this field return our server wwlcome message",
                    resolve:this.userResolver.welcome ,
                },
                checkBoolean: {
                    type:gqlTypes.checkBoolean,
                    resolve: (parent: unknown, args: any) => {
                        return true
    },
                },
                allUsers: {
                    type:gqlTypes.allUsers,
                    args:gqlArgs.allUsers ,
                    
                    
                    resolve: this.userResolver.allUsers,
                },
                searchUser: {
                    type:gqlTypes.searchUser,
                    args:gqlArgs.searchUser ,
                    resolve:this.userResolver.searchUser,
}
        }
    }
    registerMutation = () => {
        return {
             addFollowers: {
                    type:gqlTypes.addFollowers,
                    args:gqlArgs.addFollowers,
                    resolve:this.userResolver.addFollowers,
                    
                },
        }
    }
}

export default new UserGQLScema();
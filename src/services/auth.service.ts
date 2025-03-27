import { UserModel } from "../models/user.model";

export class AuthService {
    public async registerUser(user: UserModel): Promise<UserModel> {
        //Implement my register logic
        return Promise.resolve(user);
    }
}

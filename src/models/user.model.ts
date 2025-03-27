export class UserModel {
    private name: string;
    private email: string;
    private password: string | null;
    private authProvider: AuthProvider;
    private externalProviderId: string | null;
    private accountVerified: boolean;
    private createdAt: number;
    private lastEdit: number;

    public constructor(
        name: string,
        email: string,
        password: string | null,
        authProvider: AuthProvider,
        externalProviderId: string | null,
        accountVerified: boolean,
        createdAt: number
    ) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.authProvider = authProvider;
        this.externalProviderId = externalProviderId;
        this.accountVerified = accountVerified;
        this.createdAt = createdAt;
        this.lastEdit = Date.now();
        return this;
    }

    public get getName(): string {
        return this.name;
    }

    public get getEmail(): string {
        return this.email;
    }

    public get getPassword(): string | null {
        return this.password;
    }

    public get getAuthProvider(): AuthProvider {
        return this.authProvider;
    }

    public get getExternalProviderId(): string | null {
        return this.externalProviderId;
    }

    public get getAccountVerified(): boolean {
        return this.accountVerified;
    }

    public get getCreatedAt(): number {
        return this.createdAt;
    }

    public get getLastEdit(): number {
        return this.lastEdit;
    }

    public static async insert(user: UserModel): Promise<UserModel> {
        console.log("Insert user to the database...", user);
        return user;
    }

    public static async update(user: UserModel): Promise<UserModel> {
        console.log("Update user in the database...", user);
        return user;
    }

    public static async exists(user: UserModel): Promise<UserModel | null> {
        console.log("Check if the user exists in the database", user);
        return null;
    }
}

export enum AuthProvider {
    LOCAL = 0,
    GOOGLE = 1
}

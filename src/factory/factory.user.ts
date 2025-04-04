import LocalUser from "../classes/LocalUser";
import ExternalUser from "../classes/ExternalUser";

class FactoryUser {
    public static createLocalUser(name: string, email: string, password: string): LocalUser {
        return new LocalUser(name, email, password);
    }

    public static createExternalUser(name: string, email: string, externalProviderId: string): ExternalUser {
        return new ExternalUser(name, email, externalProviderId);
    }
}

export default FactoryUser;

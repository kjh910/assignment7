import { CoreEntity } from './core.entity';
export declare enum UserRole {
    'Host' = 0,
    'Listener' = 1
}
export declare class User extends CoreEntity {
    email: string;
    password: string;
    role: UserRole;
    hashPassword(): Promise<void>;
    checkPassword(aPassword: string): Promise<boolean>;
}

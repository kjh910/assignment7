import { User } from '../entities/user.entity';
import { CoreOutput } from './output.dto';
declare const CreateAccountInput_base: import("@nestjs/common").Type<Pick<User, "password" | "email" | "role">>;
export declare class CreateAccountInput extends CreateAccountInput_base {
}
export declare class CreateAccountOutput extends CoreOutput {
}
export {};

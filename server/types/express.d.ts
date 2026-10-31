
import type { Types } from "mongoose";

declare global {
    namespace Express {
        interface User {
            _id: Types.ObjectId;
            name: string;
            email: string;
            role: "seeker" | "employer";
        }

        interface Request {
            user: User;
        }
    }
}

export {};

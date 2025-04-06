import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!);
//passing in schema as the second argument inside of an object.
//allows us to use drizzle query api
const db = drizzle(sql, { schema });

export default db;
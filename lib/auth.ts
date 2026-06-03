import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/pulsewire");
const db = client.db("pulsewire");

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24, 
  },
});

export type Session = typeof auth.$Infer.Session;


export async function getUserFromRequest(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

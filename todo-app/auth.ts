import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import handlerQuery from "@/app/utils/db";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const query = `SELECT * FROM users WHERE email = $1`;
          const value = [credentials.email];
          const data = await handlerQuery(query, value);
          const user = data.rows[0] as User | undefined;
          //   console.log(data);

          // If no user found, return null
          if (!user) {
            // console.log("User not found");
            return null;
          }

          if (typeof user.password !== "string") {
            return null;
          }

          // Cast credentials.password explicitly to string to satisfy TypeScript
          const password = String(credentials.password);

          // Compare password hash using bcrypt
          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            // console.log("Password doesn't match");
            return null;
          }

          //   console.log("Credentials: " + credentials);

          // Return user object without the password
          const { password: _password, ...userWithoutPassword } = user;
          return {
            id: userWithoutPassword.id,
            name: userWithoutPassword.name,
            email: userWithoutPassword.email,
            role: userWithoutPassword.role,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // JWT configuration
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role; // Tidak ada error karena role bersifat opsional di tipe
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
});

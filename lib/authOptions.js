import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  // 🔐 Add your NextAuth secret
  secret: process.env.NEXTAUTH_SECRET,

  // ⚙️ Use JWT session strategy
  session: {
    strategy: "jwt",
  },

  // 🧾 Ensure JWT uses same secret
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  // 🔁 Redirect users to correct login page
  pages: {
    signIn: "/employer/login",
  },

  // 🔄 Manage token & session consistency
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = user.role;
      } else if (token?.sub) {
        const existing = await prisma.user.findUnique({ where: { id: token.sub } });
        if (existing) {
          token.role = existing.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export default authOptions;

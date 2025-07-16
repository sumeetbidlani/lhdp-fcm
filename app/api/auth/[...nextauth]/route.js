import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { execute } from '@/lib/db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        console.log('➡️ Login attempt:', email, password);

        const users = await execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
          console.log('❌ No user found for email:', email);
          return null;
        }

        // For now assume plain-text password (just to test, later secure with bcrypt)
        // if (user.password !== password) {
        //   console.log('❌ Password mismatch');
        //   return null;
        // }

        console.log('✅ Login successful:', user.email);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    }),
  ],
  pages: {
    signIn: '/', // Custom sign-in page
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

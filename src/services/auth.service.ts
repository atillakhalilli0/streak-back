import { supabaseAnon } from "../config/supabase.js";
import { AppError } from "../middlewares/error.middleware.js";

export interface SignUpInput {
  email: string;
  password: string;
  username?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export async function signUp(input: SignUpInput) {
  const { data, error } = await supabaseAnon.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: input.username ? { username: input.username } : undefined,
    },
  });

  if (error) throw new AppError(error.message, 400);

  // If email confirmation is enabled in your Supabase Auth settings,
  // data.session will be null here until the user clicks the
  // confirmation link — there is no access_token yet in that case.
  return {
    user: data.user,
    session: data.session,
    requiresEmailConfirmation: !data.session,
  };
}

export async function signIn(input: SignInInput) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) throw new AppError(error.message, 401);

  return { user: data.user, session: data.session };
}

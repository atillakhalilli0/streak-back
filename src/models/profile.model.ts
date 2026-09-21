export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  /**
   * Single opt-out switch for all transactional email. Every sender
   * checks this before sending — see services/mail.service.ts.
   */
  email_notifications: boolean;
  created_at: string;
}

/** Fields a user is allowed to change on their own profile. */
export interface UpdateProfileInput {
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  email_notifications?: boolean;
}

module Auth
  # Password reset: request a token (emailed) and resolve a valid, unexpired token.
  module PasswordReset
    TTL = 2.hours

    module_function

    # Always "succeeds" — never leak whether the email exists. No-op for unknown emails.
    def request(email)
      user = User.find_by(email: email.to_s.downcase.strip)
      return unless user

      user.update!(reset_password_token: SecureRandom.urlsafe_base64(32), reset_password_sent_at: Time.current)
      UserMailer.reset_password(user, user.reset_password_token).deliver_later
    end

    # The user a token belongs to, if the token exists and isn't expired — else nil.
    def resettable_user(token)
      return nil if token.blank?

      user = User.find_by(reset_password_token: token)
      user if user&.reset_password_sent_at && user.reset_password_sent_at > TTL.ago
    end
  end
end

# Resolves an OmniAuth callback to a user (login only — no account is created here).
# Links by verified email so an existing password user isn't duplicated.
module OauthSignIn
  Result = Struct.new(:ok, :user, :error, keyword_init: true)

  module_function

  def call(auth)
    return Result.new(ok: false, error: "missing_auth") if auth.blank?

    provider = auth.provider.to_s
    uid = auth.uid.to_s
    email = auth.info&.email.to_s.downcase.strip
    return Result.new(ok: false, error: "no_email") if email.blank?

    identity = Identity.find_by(provider: provider, uid: uid)
    user = identity&.user || User.find_by(email: email)

    ActiveRecord::Base.transaction do
      user ||= User.create!(
        name: auth.info.name.presence || email.split("@").first,
        email: email,
        password: SecureRandom.hex(24)
      )
      Identity.find_or_create_by!(provider: provider, uid: uid) do |identity_record|
        identity_record.user = user
        identity_record.email = email
      end
    end

    Result.new(ok: true, user: user)
  rescue ActiveRecord::RecordInvalid
    Result.new(ok: false, error: "sign_in_failed")
  end
end

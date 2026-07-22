module Auth
  # Encode / decode JWT access & refresh tokens, and maintain a jti blacklist.
  # Blacklist is keyed by `jti` (not the full token) so revocation survives re-encoding.
  module Token
    ACCESS_TTL = 4.hours
    REFRESH_TTL = 30.days
    OAUTH_HANDOFF_TTL = 2.minutes
    ALGORITHM = "HS256".freeze

    module_function

    # Short-lived, single-use (via jti blacklist) token handed to the SPA after an OAuth
    # callback; the front exchanges it for a real token pair.
    def generate_oauth_handoff(user)
      encode(user, "oauth_handoff", Time.current, OAUTH_HANDOFF_TTL)
    end

    def generate_pair(user)
      now = Time.current
      {
        access_token: encode(user, "access", now, ACCESS_TTL),
        refresh_token: encode(user, "refresh", now, REFRESH_TTL),
        expires_at: (now + ACCESS_TTL).iso8601
      }
    end

    def encode(user, type, issued_at, ttl)
      JWT.encode(
        {
          user_id: user.id,
          type: type,
          jti: SecureRandom.uuid,
          iat: issued_at.to_i,
          exp: (issued_at + ttl).to_i
        },
        secret,
        ALGORITHM
      )
    end

    def decode(token)
      return nil if token.blank?

      JWT.decode(token, secret, true, { algorithm: ALGORITHM }).first
    rescue JWT::DecodeError, JWT::ExpiredSignature
      nil
    end

    def blacklist(payload)
      return unless payload && payload["jti"]

      ttl = [payload["exp"].to_i - Time.current.to_i, 0].max
      Rails.cache.write(cache_key(payload["jti"]), true, expires_in: ttl.seconds)
    end

    def blacklisted?(jti)
      return false if jti.blank?

      Rails.cache.exist?(cache_key(jti))
    end

    def cache_key(jti)
      "jwt_blacklist:#{jti}"
    end

    def secret
      Rails.application.secret_key_base
    end
  end
end

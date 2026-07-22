# Handles the OmniAuth callback: resolves the user and hands a short-lived code back
# to the SPA (which exchanges it for a real token pair). Lives outside /v1 — the paths
# are OmniAuth's (/auth/:provider/callback).
class OmniauthCallbacksController < ActionController::Base
  # GET /auth/:provider/callback
  def callback
    result = OauthSignIn.call(request.env["omniauth.auth"])
    params = result.ok ? { code: Auth::Token.generate_oauth_handoff(result.user) } : { error: result.error }
    redirect_to callback_url(params), allow_other_host: true
  end

  # GET /auth/failure
  def failure
    redirect_to callback_url(error: params[:message] || "oauth_failed"), allow_other_host: true
  end

  private

  def callback_url(query)
    "#{ENV.fetch('FRONT_URL', 'http://localhost:5173')}/auth/callback?#{query.to_query}"
  end
end

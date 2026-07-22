# OAuth (login only). The SPA navigates (GET) to /auth/:provider; the callback issues
# a short-lived handoff code. See OmniauthCallbacksController.
OmniAuth.config.allowed_request_methods = %i[get]
OmniAuth.config.silence_get_warning = true
OmniAuth.config.logger = Rails.logger
OmniAuth.config.on_failure = proc { |env| OmniauthCallbacksController.action(:failure).call(env) }

app = Rails.application

# OmniAuth needs cookies + a session to carry the OAuth `state` across the redirect
# (API-only apps don't load these middlewares by default). The whole flow is same-origin
# on the API, so a Lax first-party cookie is enough.
app.config.middleware.use ActionDispatch::Cookies
app.config.middleware.use ActionDispatch::Session::CookieStore,
                          key: "_backlogzy_oauth", same_site: :lax, secure: Rails.env.production?

app.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2, ENV["GOOGLE_CLIENT_ID"], ENV["GOOGLE_CLIENT_SECRET"],
           scope: "email,profile", prompt: "select_account"
  provider :github, ENV["GITHUB_CLIENT_ID"], ENV["GITHUB_CLIENT_SECRET"], scope: "user:email"
end

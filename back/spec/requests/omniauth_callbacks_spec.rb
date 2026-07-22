require "rails_helper"

RSpec.describe "OmniAuth callbacks", type: :request do
  def mock_auth(email:, uid: "123", name: "G User", provider: "google_oauth2")
    OmniAuth.config.test_mode = true
    auth = OmniAuth::AuthHash.new(provider: provider, uid: uid, info: { email: email, name: name })
    OmniAuth.config.mock_auth[provider.to_sym] = auth
    Rails.application.env_config["omniauth.auth"] = auth
  end

  after do
    OmniAuth.config.mock_auth.clear
    Rails.application.env_config.delete("omniauth.auth")
    OmniAuth.config.test_mode = false
  end

  it "creates a user + identity and redirects with a code" do
    mock_auth(email: "g@example.com")

    expect { get "/auth/google_oauth2/callback" }
      .to change(User, :count).by(1).and change(Identity, :count).by(1)

    expect(response).to have_http_status(:redirect)
    expect(response.location).to match(%r{/auth/callback\?code=.+})
  end

  it "links to an existing user by email without duplicating" do
    user = create(:user, email: "existing@example.com")
    mock_auth(email: "existing@example.com")

    expect { get "/auth/google_oauth2/callback" }
      .to change(Identity, :count).by(1).and change(User, :count).by(0)
    expect(Identity.last.user).to eq(user)
  end

  it "reuses an existing identity" do
    create(:identity, provider: "google_oauth2", uid: "u-1")
    mock_auth(email: "whatever@example.com", uid: "u-1")

    expect { get "/auth/google_oauth2/callback" }
      .to change(User, :count).by(0).and change(Identity, :count).by(0)
  end

  it "redirects with an error when no email is provided" do
    mock_auth(email: nil)

    get "/auth/google_oauth2/callback"
    expect(response.location).to match(%r{/auth/callback\?error=no_email})
  end
end

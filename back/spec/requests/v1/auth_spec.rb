require "rails_helper"

RSpec.describe "V1::Auth", type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user, email: "jane@example.com", password: "password") }
  let!(:membership) { create(:account_membership, user: user, account: account) }

  describe "POST /v1/auth/login" do
    it "returns the user, tokens and memberships on valid credentials" do
      post "/v1/auth/login", params: { auth: { email: "jane@example.com", password: "password" } }.to_json,
                             headers: { "Content-Type" => "application/json" }

      expect(response).to have_http_status(:ok)
      data = json_response["data"]
      expect(data["access_token"]).to be_present
      expect(data["refresh_token"]).to be_present
      expect(data["user"]["email"]).to eq("jane@example.com")
      expect(data["user"]["accounts"].first).to include("slug" => account.slug, "role" => "admin")
    end

    it "rejects invalid credentials" do
      post "/v1/auth/login", params: { auth: { email: "jane@example.com", password: "wrong" } }.to_json,
                             headers: { "Content-Type" => "application/json" }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]["type"]).to eq("invalid_credentials")
    end
  end

  describe "POST /v1/auth/signup" do
    let(:json) { { "Content-Type" => "application/json" } }

    def signup(params)
      post "/v1/auth/signup", params: { auth: params }.to_json, headers: json
    end

    it "creates a workspace + admin user and auto-logs in" do
      expect do
        signup(workspace: "Acme Inc", name: "Jane", email: "jane2@example.com", password: "password")
      end.to change(Account, :count).by(1).and change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      data = json_response["data"]
      expect(data["access_token"]).to be_present
      expect(data["user"]["accounts"].first).to include("slug" => "acme-inc", "role" => "admin")
    end

    it "generates a unique slug on collision" do
      create(:account, slug: "acme-inc")
      signup(workspace: "Acme Inc", name: "Jane", email: "jane3@example.com", password: "password")

      expect(json_response["data"]["user"]["accounts"].first["slug"]).to eq("acme-inc-2")
    end

    it "rejects a duplicate email" do
      create(:user, email: "taken@example.com")
      signup(workspace: "Acme", name: "Jane", email: "taken@example.com", password: "password")

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["errors"]["email"]).to be_present
    end

    it "rejects a too-short password" do
      signup(workspace: "Acme", name: "Jane", email: "jane4@example.com", password: "x")

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["errors"]["password"]).to be_present
    end

    it "rejects a blank workspace" do
      signup(workspace: "", name: "Jane", email: "jane5@example.com", password: "password")

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["errors"]["workspace"]).to be_present
    end
  end

  describe "GET /v1/auth/me" do
    it "returns the current user" do
      get "/v1/auth/me", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["data"]["email"]).to eq("jane@example.com")
    end

    it "rejects a missing token" do
      get "/v1/auth/me"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "PATCH /v1/auth/me" do
    it "updates the current user's name and avatar key" do
      patch "/v1/auth/me",
            params: { user: { name: "Jane R.", avatar_key: "uploads/x/y/a.png" } }.to_json,
            headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["data"]["name"]).to eq("Jane R.")
      expect(user.reload.avatar_key).to eq("uploads/x/y/a.png")
    end

    it "rejects a blank name" do
      patch "/v1/auth/me", params: { user: { name: "" } }.to_json, headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "clears the avatar when avatar_key is null" do
      user.update!(avatar_key: "uploads/x/y/a.png")

      patch "/v1/auth/me", params: { user: { avatar_key: nil } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(user.reload.avatar_key).to be_nil
    end

    it "updates the email" do
      patch "/v1/auth/me", params: { user: { email: "new@example.com" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(user.reload.email).to eq("new@example.com")
    end

    it "rejects a duplicate email" do
      create(:user, email: "taken@example.com")
      patch "/v1/auth/me", params: { user: { email: "taken@example.com" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["errors"]["email"]).to be_present
    end
  end

  describe "PATCH /v1/auth/password" do
    it "changes the password with the correct current one" do
      patch "/v1/auth/password",
            params: { current_password: "password", password: "newpassword" }.to_json,
            headers: auth_headers(user)

      expect(response).to have_http_status(:no_content)
      expect(user.reload.authenticate("newpassword")).to be_truthy
    end

    it "rejects a wrong current password" do
      patch "/v1/auth/password",
            params: { current_password: "wrong", password: "newpassword" }.to_json,
            headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["errors"]["current_password"]).to be_present
    end

    it "rejects a too-short new password" do
      patch "/v1/auth/password",
            params: { current_password: "password", password: "x" }.to_json,
            headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /v1/auth/oauth/exchange" do
    let(:json) { { "Content-Type" => "application/json" } }

    it "trades a one-time handoff code for a token pair" do
      code = Auth::Token.generate_oauth_handoff(user)

      post "/v1/auth/oauth/exchange", params: { code: code }.to_json, headers: json

      expect(response).to have_http_status(:ok)
      expect(json_response["data"]["access_token"]).to be_present
      expect(json_response["data"]["user"]["email"]).to eq(user.email)
    end

    it "rejects an invalid code" do
      post "/v1/auth/oauth/exchange", params: { code: "nope" }.to_json, headers: json
      expect(response).to have_http_status(:unauthorized)
    end

    it "is single-use" do
      code = Auth::Token.generate_oauth_handoff(user)
      post "/v1/auth/oauth/exchange", params: { code: code }.to_json, headers: json
      post "/v1/auth/oauth/exchange", params: { code: code }.to_json, headers: json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /v1/auth/refresh" do
    it "issues a new token pair from a valid refresh token" do
      tokens = Auth::Token.generate_pair(user)

      post "/v1/auth/refresh", params: { refresh_token: tokens[:refresh_token] }.to_json,
                               headers: { "Content-Type" => "application/json" }

      expect(response).to have_http_status(:ok)
      expect(json_response["data"]["access_token"]).to be_present
    end

    it "rejects an access token used as a refresh token" do
      tokens = Auth::Token.generate_pair(user)

      post "/v1/auth/refresh", params: { refresh_token: tokens[:access_token] }.to_json,
                               headers: { "Content-Type" => "application/json" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /v1/auth/logout" do
    it "blacklists the access token by jti" do
      tokens = Auth::Token.generate_pair(user)
      headers = { "Authorization" => "Bearer #{tokens[:access_token]}", "Content-Type" => "application/json" }

      delete "/v1/auth/logout", headers: headers
      expect(response).to have_http_status(:no_content)

      get "/v1/auth/me", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

require "rails_helper"

RSpec.describe "V1::InvitationAcceptances", type: :request do
  let(:account) { create(:account, name: "Acme") }
  let(:json) { { "Content-Type" => "application/json", "Accept" => "application/json" } }

  describe "GET /v1/invitations/accept" do
    it "previews the invitation (needs_password for a new email)" do
      invitation = create(:invitation, account: account, email: "new@example.com")
      get "/v1/invitations/accept", params: { token: invitation.token }

      expect(response).to have_http_status(:ok)
      expect(json_response["data"]).to include("account" => "Acme", "needs_password" => true)
    end

    it "rejects an invalid token" do
      get "/v1/invitations/accept", params: { token: "nope" }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /v1/invitations/accept" do
    it "creates a new user + membership and returns tokens" do
      invitation = create(:invitation, account: account, email: "new@example.com", role: "member")

      post "/v1/invitations/accept",
           params: { token: invitation.token, name: "New User", password: "password123" }.to_json, headers: json

      expect(response).to have_http_status(:created)
      expect(json_response["data"]["access_token"]).to be_present
      expect(User.find_by(email: "new@example.com").accounts).to include(account)
      expect(invitation.reload.accepted_at).to be_present
    end

    it "adds a membership for an existing user" do
      existing = create(:user, email: "existing@example.com")
      invitation = create(:invitation, account: account, email: "existing@example.com", role: "member")

      post "/v1/invitations/accept", params: { token: invitation.token }.to_json, headers: json

      expect(response).to have_http_status(:ok)
      expect(json_response["data"]["existing"]).to be(true)
      expect(existing.reload.accounts).to include(account)
    end

    it "rejects a new user without a valid password" do
      invitation = create(:invitation, account: account, email: "new@example.com")

      post "/v1/invitations/accept", params: { token: invitation.token, name: "X", password: "" }.to_json, headers: json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end

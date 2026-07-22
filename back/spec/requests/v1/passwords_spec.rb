require "rails_helper"

RSpec.describe "V1::Passwords", type: :request do
  let!(:user) { create(:user, email: "jane@example.com", password: "password123") }
  let(:headers) { { "Content-Type" => "application/json", "Accept" => "application/json" } }

  describe "POST /v1/auth/password/forgot" do
    it "enqueues a reset email and stores a token" do
      expect do
        post "/v1/auth/password/forgot", params: { email: "jane@example.com" }.to_json, headers: headers
      end.to have_enqueued_mail(UserMailer, :reset_password)

      expect(response).to have_http_status(:accepted)
      expect(user.reload.reset_password_token).to be_present
    end

    it "does not leak unknown emails (always accepted, no mail)" do
      expect do
        post "/v1/auth/password/forgot", params: { email: "nobody@example.com" }.to_json, headers: headers
      end.not_to have_enqueued_mail

      expect(response).to have_http_status(:accepted)
    end
  end

  describe "POST /v1/auth/password/reset" do
    def token_for(email)
      Auth::PasswordReset.request(email)
      user.reload.reset_password_token
    end

    it "resets the password with a valid token" do
      token = token_for("jane@example.com")

      post "/v1/auth/password/reset", params: { token: token, password: "newpassword" }.to_json, headers: headers

      expect(response).to have_http_status(:no_content)
      expect(user.reload.authenticate("newpassword")).to be_truthy
      expect(user.reset_password_token).to be_nil
    end

    it "rejects an invalid token" do
      post "/v1/auth/password/reset", params: { token: "nope", password: "newpassword" }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "rejects an expired token" do
      token = token_for("jane@example.com")
      user.update!(reset_password_sent_at: 3.hours.ago)

      post "/v1/auth/password/reset", params: { token: token, password: "newpassword" }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "rejects a too-short password" do
      token = token_for("jane@example.com")

      post "/v1/auth/password/reset", params: { token: token, password: "x" }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end

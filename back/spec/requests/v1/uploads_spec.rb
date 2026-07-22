require "rails_helper"

RSpec.describe "V1::Uploads", type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user) }
  let!(:membership) { create(:account_membership, user: user, account: account) }
  let(:headers) { auth_headers(user, account) }

  # Presigning is a local, offline signing operation — dummy creds are enough.
  around do |example|
    env = { "SCALEWAY_ACCESS_KEY" => "test-key", "SCALEWAY_SECRET_KEY" => "test-secret",
            "SCALEWAY_REGION" => "fr-par", "SCALEWAY_BUCKET_NAME" => "test-bucket" }
    env.each { |k, v| ENV[k] = v }
    begin
      example.run
    ensure
      env.each_key { |k| ENV.delete(k) }
    end
  end

  describe "POST /v1/uploads" do
    it "returns a presigned PUT url and an account-scoped key for an allowed type" do
      post "/v1/uploads", params: { filename: "logo.png", content_type: "image/png" }.to_json, headers: headers

      expect(response).to have_http_status(:ok)
      data = json_response["data"]
      expect(data["key"]).to start_with("uploads/#{account.id}/")
      expect(data["key"]).to end_with("logo.png")
      expect(data["url"]).to include("test-bucket", "X-Amz-Signature")
    end

    it "rejects a disallowed content type" do
      post "/v1/uploads", params: { filename: "x.txt", content_type: "text/plain" }.to_json, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["error"]["type"]).to eq("unsupported_type")
    end

    it "requires authentication" do
      post "/v1/uploads", params: { filename: "logo.png", content_type: "image/png" }.to_json,
                          headers: { "Content-Type" => "application/json" }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end

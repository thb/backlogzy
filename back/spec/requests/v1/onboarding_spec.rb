require "rails_helper"

RSpec.describe "V1::Onboarding", type: :request do
  let(:user) { create(:user) }

  it "creates a workspace with the current user as admin" do
    expect do
      post "/v1/onboarding", params: { workspace: "My Co" }.to_json, headers: auth_headers(user)
    end.to change(Account, :count).by(1)

    expect(response).to have_http_status(:created)
    account = json_response["data"]["accounts"].first
    expect(account).to include("slug" => "my-co", "role" => "admin")
  end

  it "generates a unique slug on collision" do
    create(:account, slug: "my-co")
    post "/v1/onboarding", params: { workspace: "My Co" }.to_json, headers: auth_headers(user)

    expect(json_response["data"]["accounts"].first["slug"]).to eq("my-co-2")
  end

  it "rejects a blank workspace" do
    post "/v1/onboarding", params: { workspace: "" }.to_json, headers: auth_headers(user)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json_response["errors"]["workspace"]).to be_present
  end

  it "requires authentication" do
    post "/v1/onboarding", params: { workspace: "X" }.to_json, headers: { "Content-Type" => "application/json" }
    expect(response).to have_http_status(:unauthorized)
  end
end

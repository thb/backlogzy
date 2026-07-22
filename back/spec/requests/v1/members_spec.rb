require "rails_helper"

RSpec.describe "V1::Members", type: :request do
  let(:account) { create(:account) }
  let(:admin) { create(:user) }
  let!(:admin_membership) { create(:account_membership, user: admin, account: account, role: "admin") }
  let(:headers) { auth_headers(admin, account) }

  def add_member(role: "member")
    create(:account_membership, user: create(:user), account: account, role: role)
  end

  describe "GET /v1/members" do
    it "lists members for an admin" do
      get "/v1/members", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json_response["data"].first["user"]["email"]).to eq(admin.email)
    end

    it "forbids non-admins" do
      member = add_member
      get "/v1/members", headers: auth_headers(member.user, account)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /v1/members/:id" do
    it "changes a member's role" do
      member = add_member
      patch "/v1/members/#{member.id}", params: { membership: { role: "admin" } }.to_json, headers: headers
      expect(response).to have_http_status(:ok)
      expect(member.reload.role).to eq("admin")
    end

    it "won't demote the last admin" do
      patch "/v1/members/#{admin_membership.id}", params: { membership: { role: "member" } }.to_json, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["error"]["type"]).to eq("last_admin")
    end
  end

  describe "DELETE /v1/members/:id" do
    it "removes a member" do
      member = add_member
      expect { delete "/v1/members/#{member.id}", headers: headers }.to change(AccountMembership, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end

    it "won't remove yourself" do
      delete "/v1/members/#{admin_membership.id}", headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["error"]["type"]).to eq("cannot_remove_self")
    end
  end
end

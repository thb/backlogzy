require "rails_helper"

RSpec.describe "V1::Invitations", type: :request do
  let(:account) { create(:account) }
  let(:admin) { create(:user) }
  let!(:admin_membership) { create(:account_membership, user: admin, account: account, role: "admin") }
  let(:headers) { auth_headers(admin, account) }

  describe "POST /v1/invitations" do
    it "creates an invitation and emails it" do
      expect do
        post "/v1/invitations", params: { invitation: { email: "new@example.com", role: "member" } }.to_json, headers: headers
      end.to have_enqueued_mail(InvitationMailer, :invite)

      expect(response).to have_http_status(:created)
      expect(account.invitations.pending.count).to eq(1)
    end

    it "forbids non-admins" do
      member = create(:account_membership, user: create(:user), account: account, role: "member")
      post "/v1/invitations", params: { invitation: { email: "x@example.com", role: "member" } }.to_json,
                              headers: auth_headers(member.user, account)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /v1/invitations" do
    it "lists pending invitations" do
      create(:invitation, account: account)
      get "/v1/invitations", headers: headers
      expect(json_response["data"].size).to eq(1)
    end
  end

  describe "POST /v1/invitations/:id/resend" do
    it "re-sends the email and refreshes the expiry" do
      invitation = create(:invitation, account: account, sent_at: 6.days.ago)

      expect do
        post "/v1/invitations/#{invitation.id}/resend", headers: headers
      end.to have_enqueued_mail(InvitationMailer, :invite)

      expect(response).to have_http_status(:no_content)
      expect(invitation.reload.sent_at).to be > 1.minute.ago
    end
  end

  describe "DELETE /v1/invitations/:id" do
    it "revokes an invitation" do
      invitation = create(:invitation, account: account)
      delete "/v1/invitations/#{invitation.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(Invitation.exists?(invitation.id)).to be(false)
    end
  end
end

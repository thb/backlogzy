require "rails_helper"

RSpec.describe InvitationMailer, type: :mailer do
  it "addresses the invitee with an accept link" do
    invitation = create(:invitation, email: "i@example.com")
    mail = described_class.invite(invitation)

    expect(mail.to).to eq(["i@example.com"])
    expect(mail.subject).to match(/invited/i)
    expect(mail.body.encoded).to include("/invitations/accept?token=#{invitation.token}")
  end
end

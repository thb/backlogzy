require "rails_helper"

RSpec.describe Invitation, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:account) }
    it { is_expected.to belong_to(:invited_by).class_name("User").optional }
  end

  describe "validations" do
    subject { build(:invitation) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_inclusion_of(:role).in_array(AccountMembership::ROLES) }

    it "rejects a second pending invitation for the same email + account" do
      existing = create(:invitation)
      expect(build(:invitation, account: existing.account, email: existing.email)).not_to be_valid
    end
  end

  it "generates a token and normalizes the email on create" do
    invitation = create(:invitation, email: "  UP@Example.COM ")
    expect(invitation.token).to be_present
    expect(invitation.email).to eq("up@example.com")
  end

  it "expires based on sent_at, and resend! refreshes it" do
    expect(create(:invitation, sent_at: 8.days.ago)).to be_expired

    invitation = create(:invitation, sent_at: 8.days.ago)
    invitation.resend!
    expect(invitation).not_to be_expired
  end
end

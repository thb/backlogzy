require "rails_helper"

RSpec.describe UserMailer, type: :mailer do
  describe "reset_password" do
    let(:user) { create(:user, email: "jane@example.com", name: "Jane") }
    let(:mail) { described_class.reset_password(user, "tok-123") }

    it "is addressed to the user with a reset link" do
      expect(mail.to).to eq(["jane@example.com"])
      expect(mail.subject).to match(/reset/i)
      expect(mail.body.encoded).to include("/reset?token=tok-123")
    end
  end
end

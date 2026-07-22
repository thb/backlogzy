require "rails_helper"

RSpec.describe User, type: :model do
  describe "associations" do
    it { is_expected.to have_many(:account_memberships).dependent(:destroy) }
    it { is_expected.to have_many(:accounts).through(:account_memberships) }
  end

  describe "validations" do
    subject { build(:user) }

    it { is_expected.to have_secure_password }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }

    it "rejects a malformed email" do
      expect(build(:user, email: "nope")).not_to be_valid
    end
  end

  describe "email normalization" do
    it "downcases and strips the email" do
      user = create(:user, email: "  MixedCase@Example.COM ")
      expect(user.email).to eq("mixedcase@example.com")
    end
  end
end

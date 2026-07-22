require "rails_helper"

RSpec.describe AccountMembership, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:account) }
  end

  describe "validations" do
    subject { build(:account_membership) }

    it { is_expected.to validate_inclusion_of(:role).in_array(AccountMembership::ROLES) }

    it "is unique per user and account" do
      existing = create(:account_membership)
      duplicate = build(:account_membership, user: existing.user, account: existing.account)
      expect(duplicate).not_to be_valid
    end
  end

  describe ".active" do
    it "returns only active memberships" do
      active = create(:account_membership, active: true)
      create(:account_membership, active: false)
      expect(described_class.active).to contain_exactly(active)
    end
  end
end

require "rails_helper"

RSpec.describe Account, type: :model do
  describe "associations" do
    it { is_expected.to have_many(:account_memberships).dependent(:destroy) }
    it { is_expected.to have_many(:users).through(:account_memberships) }
  end

  describe "validations" do
    subject { build(:account) }

    it { is_expected.to validate_presence_of(:slug) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:slug) }

    it "rejects a slug with invalid characters" do
      expect(build(:account, slug: "Not Valid!")).not_to be_valid
      expect(build(:account, slug: "valid-slug-1")).to be_valid
    end
  end
end

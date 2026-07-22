require "rails_helper"

RSpec.describe Project, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:account) }
    it { is_expected.to have_many(:items).dependent(:destroy) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }

    it "only accepts a known color" do
      account = create(:account)
      expect(build(:project, account: account, color: "teal")).to be_valid
      expect(build(:project, account: account, color: "magenta")).not_to be_valid
    end
  end

  describe ".ordered" do
    it "sorts by position" do
      account = create(:account)
      second = create(:project, account: account, position: 2)
      first = create(:project, account: account, position: 1)

      expect(account.projects.ordered).to eq([first, second])
    end
  end
end

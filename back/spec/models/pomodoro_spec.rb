require "rails_helper"

RSpec.describe Pomodoro, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:account) }
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:date) }
    it { is_expected.to validate_numericality_of(:count).is_greater_than_or_equal_to(0) }

    it "allows a single row per user and day" do
      existing = create(:pomodoro)
      dup = build(:pomodoro, account: existing.account, user: existing.user, date: existing.date)
      expect(dup).not_to be_valid
    end
  end

  describe "date range scopes" do
    it "filters with from_date / to_date" do
      recent = create(:pomodoro, date: "2026-04-02")
      create(:pomodoro, date: "2026-03-01")

      expect(described_class.from_date("2026-04-01")).to contain_exactly(recent)
      expect(described_class.to_date("2026-03-31").count).to eq(1)
    end
  end
end

require "rails_helper"

RSpec.describe HabitEntry, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:account) }
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:date) }
    it { is_expected.to validate_presence_of(:emoji) }

    it "rejects the same habit twice for one user and day" do
      existing = create(:habit_entry)
      dup = build(:habit_entry, account: existing.account, user: existing.user,
                                date: existing.date, emoji: existing.emoji)
      expect(dup).not_to be_valid
    end
  end

  describe "date range scopes" do
    it "filters with from_date / to_date" do
      entry = create(:habit_entry, date: "2026-04-02")
      create(:habit_entry, date: "2026-03-01")

      expect(described_class.from_date("2026-04-01")).to contain_exactly(entry)
      expect(described_class.to_date("2026-03-31").count).to eq(1)
    end
  end
end

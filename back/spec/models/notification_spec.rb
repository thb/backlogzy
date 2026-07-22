require "rails_helper"

RSpec.describe Notification, type: :model do
  describe "validations" do
    it { is_expected.to validate_inclusion_of(:action).in_array(described_class::ACTIONS) }

    it "is valid with an allowed action" do
      expect(build(:notification, action: "member_added")).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:account) }
    it { is_expected.to belong_to(:recipient).class_name("User") }
    it { is_expected.to belong_to(:actor).class_name("User").optional }
    it { is_expected.to belong_to(:notifiable).optional }
  end

  describe "scopes" do
    let(:account) { create(:account) }

    it ".unread returns only notifications without read_at" do
      unread = create(:notification, account: account)
      create(:notification, account: account, read_at: Time.current)
      expect(described_class.unread).to eq([unread])
    end

    it ".recent orders by created_at desc" do
      old = create(:notification, account: account, created_at: 2.days.ago)
      fresh = create(:notification, account: account, created_at: 1.hour.ago)
      expect(described_class.recent).to eq([fresh, old])
    end
  end

  describe "#read? / #mark_read!" do
    it "flips read_at once and is idempotent" do
      notification = create(:notification)
      expect(notification.read?).to be(false)

      notification.mark_read!
      expect(notification.read?).to be(true)

      previous = notification.read_at
      notification.mark_read!
      expect(notification.read_at).to eq(previous)
    end
  end
end

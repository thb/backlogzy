class HabitEntry < ApplicationRecord
  belongs_to :account
  belongs_to :user

  validates :date, presence: true
  validates :emoji, presence: true,
                    uniqueness: { scope: %i[account_id user_id date] }

  scope :from_date, ->(date) { where(date: Date.parse(date)..) }
  scope :to_date, ->(date) { where(date: ..Date.parse(date)) }
end

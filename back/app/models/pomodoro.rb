class Pomodoro < ApplicationRecord
  belongs_to :account
  belongs_to :user

  validates :date, presence: true, uniqueness: { scope: %i[account_id user_id] }
  validates :count, numericality: { greater_than_or_equal_to: 0 }

  scope :from_date, ->(date) { where(date: Date.parse(date)..) }
  scope :to_date, ->(date) { where(date: ..Date.parse(date)) }
end

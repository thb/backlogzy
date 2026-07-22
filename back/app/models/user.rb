class User < ApplicationRecord
  has_secure_password

  has_many :account_memberships, dependent: :destroy
  has_many :accounts, through: :account_memberships
  has_many :identities, dependent: :destroy
  has_many :notifications, foreign_key: :recipient_id, inverse_of: :recipient, dependent: :destroy
  has_many :habit_entries, dependent: :destroy
  has_many :pomodoros, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true

  normalizes :email, with: ->(email) { email.strip.downcase }
end

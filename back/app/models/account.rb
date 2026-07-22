class Account < ApplicationRecord
  has_many :account_memberships, dependent: :destroy
  has_many :users, through: :account_memberships
  has_many :projects, dependent: :destroy
  has_many :items, through: :projects
  has_many :habit_entries, dependent: :destroy
  has_many :pomodoros, dependent: :destroy
  has_many :invitations, dependent: :destroy
  has_many :notifications, dependent: :destroy

  validates :slug, presence: true, uniqueness: true,
                   format: { with: /\A[a-z0-9-]+\z/, message: "only lowercase letters, numbers and dashes" }
  validates :name, presence: true

  # URL-safe, unique slug derived from a workspace name (suffix on collision).
  def self.unique_slug(name)
    base = name.to_s.parameterize.presence || "workspace"
    candidate = base
    suffix = 1
    while exists?(slug: candidate)
      suffix += 1
      candidate = "#{base}-#{suffix}"
    end
    candidate
  end
end

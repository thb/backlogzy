class AccountMembership < ApplicationRecord
  ROLES = %w[admin member].freeze

  belongs_to :user
  belongs_to :account

  validates :role, inclusion: { in: ROLES }
  validates :user_id, uniqueness: { scope: :account_id }

  scope :active, -> { where(active: true) }
end

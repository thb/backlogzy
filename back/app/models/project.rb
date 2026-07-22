class Project < ApplicationRecord
  COLORS = %w[gray red orange yellow green teal blue purple pink].freeze

  belongs_to :account
  has_many :items, dependent: :destroy

  validates :name, presence: true
  validates :color, inclusion: { in: COLORS }
  validates :position, presence: true

  scope :ordered, -> { order(:position, :created_at) }
end

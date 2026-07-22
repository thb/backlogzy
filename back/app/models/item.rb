class Item < ApplicationRecord
  KINDS = %w[task separator].freeze
  STATUSES = %w[TODO IN_DESIGN IN_DEV IN_QA IN_PROD WAITING REDO].freeze

  belongs_to :project

  validates :kind, inclusion: { in: KINDS }
  validates :status, inclusion: { in: STATUSES }
  validates :position, presence: true

  # Scopes consumed by has_scope in the controller.
  scope :by_project, ->(project_id) { where(project_id: project_id) }
  scope :by_kind, ->(kind) { where(kind: kind) }
  scope :ordered, -> { order(:position, :created_at) }
end

module V1
  class ItemBlueprint < Blueprinter::Base
    identifier :id

    fields :project_id, :kind, :description, :label, :status, :estimation,
           :time_spent, :notes, :planned_start, :planned_end, :completed_at,
           :archived_at, :position, :created_at, :updated_at
  end
end

module V1
  class ProjectBlueprint < Blueprinter::Base
    identifier :id

    fields :name, :color, :position, :created_at, :updated_at
  end
end

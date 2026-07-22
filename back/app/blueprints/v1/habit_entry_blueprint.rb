module V1
  class HabitEntryBlueprint < Blueprinter::Base
    identifier :id

    fields :date, :emoji
  end
end

module V1
  class PomodoroBlueprint < Blueprinter::Base
    identifier :id

    fields :date, :count
  end
end

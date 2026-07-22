module V1
  class InvitationBlueprint < Blueprinter::Base
    identifier :id

    fields :email, :role, :created_at
  end
end

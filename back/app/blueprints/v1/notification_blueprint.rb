module V1
  class NotificationBlueprint < Blueprinter::Base
    identifier :id

    fields :action, :data, :notifiable_type, :notifiable_id, :created_at

    field(:read) { |notification| notification.read? }
    field(:actor_name) { |notification| notification.actor&.name }
  end
end

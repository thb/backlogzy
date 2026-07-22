module V1
  class MembershipBlueprint < Blueprinter::Base
    identifier :id

    fields :role, :active

    field :user do |membership|
      {
        id: membership.user_id,
        name: membership.user.name,
        email: membership.user.email,
        avatar_url: S3Storage.presign_get(membership.user.avatar_key)
      }
    end
  end
end
